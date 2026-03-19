export type Segment = { id: string; text: string; color: string };
export type Wheel = { id: string; name: string; segments: Segment[] };
export type SpinLog = {
  id: string;
  timestamp: number;
  wheelName: string;
  segmentText: string;
  segmentColor: string;
  provablyFair?: ProvablyFairResult;
};

export type ProvablyFairSession = {
  sessionId: string;
  serverSeedHash: string;
  nonce: number;
};

export type ProvablyFairResult = {
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  resultIndex: number;
};

export type VerifyResult = {
  valid: boolean;
  hashValid?: boolean;
  resultValid?: boolean;
  error?: string;
};
