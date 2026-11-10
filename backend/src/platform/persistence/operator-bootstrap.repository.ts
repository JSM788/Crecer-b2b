import { randomUUID } from 'node:crypto';
import { Database } from '../database';

export interface VisitBootstrapInput {
  companyId: string;
  membershipId: string;
  customerName: string;
  customerAddress: string;
  scheduledAt: string;
}

/** Privileged local operator adapter; not exposed by a customer-facing controller. */
export class OperatorBootstrapRepository {
  constructor(private readonly database: Database) {}

  async assignVisit(input: VisitBootstrapInput): Promise<{ customerId: string; visitId: string }> {
    const customerId = randomUUID();
    const visitId = randomUUID();
    await this.database.transaction(async transaction => {
      await transaction.query(
        'SELECT id FROM memberships WHERE company_id=$1 AND id=$2 FOR UPDATE',
        [input.companyId, input.membershipId],
      );
      await transaction.query(
        'INSERT INTO customers(id,company_id,name,address) VALUES($1,$2,$3,$4)',
        [customerId, input.companyId, input.customerName, input.customerAddress],
      );
      await transaction.query(
        'INSERT INTO customer_assignments(company_id,customer_id,membership_id) VALUES($1,$2,$3)',
        [input.companyId, customerId, input.membershipId],
      );
      await transaction.query(
        'INSERT INTO visits(id,company_id,membership_id,customer_id,scheduled_at) VALUES($1,$2,$3,$4,$5)',
        [visitId, input.companyId, input.membershipId, customerId, input.scheduledAt],
      );
    });
    return { customerId, visitId };
  }
}
