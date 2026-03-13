import type { FastifyInstance } from 'fastify';
import { generateServerSeed, hashServerSeed, computeResultIndex } from '../utils/provablyFair.js';

// ---------------------------------------------------------------------------
// In-memory session store
// Each session holds a server seed that was committed to (via hash) before
// the spin. Sessions expire after 30 minutes.
// ---------------------------------------------------------------------------

type Session = {
  serverSeed: string;
  serverSeedHash: string;
  nonce: number;
  createdAt: number;
  used: boolean;
};

const sessions = new Map<string, Session>();

// Purge stale sessions every 10 minutes
const SESSION_TTL_MS = 30 * 60 * 1000;
setInterval(
  () => {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [id, s] of sessions.entries()) {
      if (s.createdAt < cutoff) sessions.delete(id);
    }
  },
  10 * 60 * 1000
);

// ---------------------------------------------------------------------------
// Request / response types
// ---------------------------------------------------------------------------

type SpinBody = {
  sessionId: string;
  clientSeed: string;
  totalSegments: number;
};

type VerifyBody = {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  resultIndex: number;
  totalSegments: number;
};

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export async function provablyFairRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/provably-fair/init
   *
   * Creates a new spin session. Returns the SHA-256 hash of the server seed
   * so the client can verify later that the server did not alter the seed.
   */
  fastify.post('/api/provably-fair/init', async () => {
    const serverSeed = generateServerSeed();
    const serverSeedHash = hashServerSeed(serverSeed);
    const sessionId = crypto.randomUUID();

    sessions.set(sessionId, {
      serverSeed,
      serverSeedHash,
      nonce: 0,
      createdAt: Date.now(),
      used: false,
    });

    return { sessionId, serverSeedHash, nonce: 0 };
  });

  /**
   * POST /api/provably-fair/spin
   *
   * Executes a spin for an existing session.
   * - Combines serverSeed + clientSeed + nonce via HMAC-SHA256 to determine
   *   the winning segment index deterministically.
   * - Reveals the serverSeed so the client (and anyone) can verify the result.
   */
  fastify.post<{ Body: SpinBody }>('/api/provably-fair/spin', async (request, reply) => {
    const { sessionId, clientSeed, totalSegments } = request.body ?? {};

    if (!sessionId || typeof sessionId !== 'string') {
      return reply.status(400).send({ error: 'Missing or invalid sessionId' });
    }
    if (!clientSeed || typeof clientSeed !== 'string') {
      return reply.status(400).send({ error: 'Missing or invalid clientSeed' });
    }
    if (typeof totalSegments !== 'number' || totalSegments < 1) {
      return reply.status(400).send({ error: 'Invalid totalSegments' });
    }

    const session = sessions.get(sessionId);
    if (!session) {
      return reply.status(404).send({ error: 'Session not found or expired' });
    }
    if (session.used) {
      return reply.status(409).send({ error: 'Session already used' });
    }

    const { serverSeed, serverSeedHash, nonce } = session;
    const resultIndex = computeResultIndex(serverSeed, clientSeed, nonce, totalSegments);

    // Mark session as consumed
    session.used = true;

    return {
      resultIndex,
      serverSeed, // Revealed — user can now verify SHA256(serverSeed) === serverSeedHash
      serverSeedHash,
      clientSeed,
      nonce,
    };
  });

  /**
   * POST /api/provably-fair/verify
   *
   * Stateless verification endpoint. Given all the public parameters of a
   * past spin, recomputes the expected result and confirms it matches.
   */
  fastify.post<{ Body: VerifyBody }>('/api/provably-fair/verify', async (request, reply) => {
    const { serverSeed, serverSeedHash, clientSeed, nonce, resultIndex, totalSegments } =
      request.body ?? {};

    if (
      !serverSeed ||
      !serverSeedHash ||
      !clientSeed ||
      typeof nonce !== 'number' ||
      typeof resultIndex !== 'number' ||
      typeof totalSegments !== 'number' ||
      totalSegments < 1
    ) {
      return reply.status(400).send({ error: 'Missing or invalid fields' });
    }

    const computedHash = hashServerSeed(serverSeed);
    const hashValid = computedHash === serverSeedHash;
    const expectedIndex = computeResultIndex(serverSeed, clientSeed, nonce, totalSegments);
    const resultValid = expectedIndex === resultIndex;

    return {
      valid: hashValid && resultValid,
      hashValid,
      resultValid,
      expectedIndex,
      computedHash,
    };
  });
}
