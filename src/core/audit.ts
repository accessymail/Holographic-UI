import type { AuditRecord } from './types';
import { EventBus } from './event-bus';

export class AuditTrail {
  readonly events = new EventBus<{ record: AuditRecord }>();
  private readonly records: AuditRecord[] = [];
  constructor(private readonly maxRecords = 500) {}

  record(input: Omit<AuditRecord, 'id' | 'timestamp'>): AuditRecord {
    const record: AuditRecord = { ...input, id: crypto.randomUUID(), timestamp: Date.now() };
    this.records.push(record);
    while (this.records.length > this.maxRecords) this.records.shift();
    this.events.emit('record', record);
    return record;
  }

  snapshot(): readonly AuditRecord[] { return [...this.records]; }
  clear(): void { this.records.length = 0; }
}
