export interface FirecrawlJobLog {
  clientName: string;
  mode: string;
  config: any;
  trace: any[];
  jobId: string;
  status: 'running' | 'complete' | 'failed';
  partnerCount: number;
  terminationReason?: string;
  createdAt: string;
}

const jobLogs: FirecrawlJobLog[] = [];

export function addJobLog(entry: FirecrawlJobLog) {
  jobLogs.unshift(entry);
}

export function updateJobLog(jobId: string, updates: Partial<FirecrawlJobLog>) {
  const idx = jobLogs.findIndex((j) => j.jobId === jobId);
  if (idx >= 0) {
    jobLogs[idx] = { ...jobLogs[idx], ...updates };
  }
}

export function getLatestJobLogByClient(clientName: string): FirecrawlJobLog | null {
  return jobLogs.find((j) => j.clientName === clientName) || null;
}
