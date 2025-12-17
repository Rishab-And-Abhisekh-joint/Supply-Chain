import { Controller, Get, Post, Body, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { Event, EventType } from './entities/event.entity';
import { CreateEventDto, EventStreamResponseDto } from './dto/event.dto';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * GET /events/stream
   * Primary endpoint for operations-client.tsx
   * Returns event stream for real-time operations analysis
   */
  @Get('stream')
  @ApiOperation({ summary: 'Get event stream for operations analysis' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max events to return (default: 50)' })
  @ApiQuery({ name: 'since', required: false, type: String, description: 'ISO timestamp to filter events after' })
  @ApiResponse({ status: 200, description: 'Event stream', type: EventStreamResponseDto })
  async getEventStream(
    @Query('limit') limit?: number,
    @Query('since') since?: string,
  ): Promise<{ events: Event[] }> {
    const sinceDate = since ? new Date(since) : undefined;
    const events = await this.eventsService.getEventStream(limit || 50, sinceDate);
    return { events };
  }

  /**
   * GET /events
   * Get recent events with optional filters
   */
  @Get()
  @ApiOperation({ summary: 'Get recent events' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: EventType })
  @ApiResponse({ status: 200, description: 'List of events' })
  async getEvents(
    @Query('limit') limit?: number,
    @Query('type') type?: EventType,
  ): Promise<{ events: Event[] }> {
    const events = await this.eventsService.getRecentEvents(limit || 50, type);
    return { events };
  }

  /**
   * GET /events/anomalies
   * Get suspicious and anomalous events
   */
  @Get('anomalies')
  @ApiOperation({ summary: 'Get suspicious and anomalous events' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Anomalous events' })
  async getAnomalies(
    @Query('limit') limit?: number,
  ): Promise<{ events: Event[] }> {
    const events = await this.eventsService.getAnomalies(limit || 50);
    return { events };
  }

  /**
   * GET /events/category/:category
   * Get events by category
   */
  @Get('category/:category')
  @ApiOperation({ summary: 'Get events by category' })
  @ApiResponse({ status: 200, description: 'Events in category' })
  async getEventsByCategory(
    @Param('category') category: string,
    @Query('limit') limit?: number,
  ): Promise<{ events: Event[] }> {
    const events = await this.eventsService.getEventsByCategory(category, limit || 50);
    return { events };
  }

  /**
   * GET /events/stats
   * Get event statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get event statistics' })
  @ApiResponse({ status: 200, description: 'Event statistics' })
  async getEventStats() {
    return this.eventsService.getEventStats();
  }

  /**
   * POST /events
   * Create a new event
   */
  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventsService.createEvent(createEventDto);
  }

  /**
   * POST /events/batch
   * Create multiple events
   */
  @Post('batch')
  @ApiOperation({ summary: 'Create multiple events' })
  @ApiResponse({ status: 201, description: 'Events created' })
  async createEvents(@Body() events: CreateEventDto[]): Promise<{ events: Event[]; count: number }> {
    const createdEvents = await this.eventsService.createEvents(events);
    return { events: createdEvents, count: createdEvents.length };
  }

  /**
   * DELETE /events/cleanup
   * Delete old events
   */
  @Delete('cleanup')
  @ApiOperation({ summary: 'Delete events older than specified days' })
  @ApiQuery({ name: 'daysOld', required: false, type: Number, description: 'Days old to delete (default: 30)' })
  @ApiResponse({ status: 200, description: 'Cleanup result' })
  async cleanupOldEvents(
    @Query('daysOld') daysOld?: number,
  ): Promise<{ deleted: number }> {
    const deleted = await this.eventsService.deleteOldEvents(daysOld || 30);
    return { deleted };
  }
}