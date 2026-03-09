import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';

/**
 * @Global() garante que MetricsService é injetável em qualquer módulo
 * sem precisar re-importar MetricsModule em cada um.
 */
@Global()
@Module({
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
