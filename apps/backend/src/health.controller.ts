import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

// Probes call a fixed path, so health stays outside the /api/v1 prefix and versioning.
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Get()
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
