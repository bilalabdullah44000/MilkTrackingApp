import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CustomersService } from './customers.service';

@Injectable()
export class CustomersScheduler {
  private readonly logger = new Logger(CustomersScheduler.name);

  constructor(private readonly customersService: CustomersService) {}

  @Cron('0 0 1 * *')
  async resetBillStatusMonthly() {
    this.logger.log('Resetting all customer bill statuses to UNPAID');
    await this.customersService.resetAllBillStatus();
    this.logger.log('Bill status reset complete');
  }
}
