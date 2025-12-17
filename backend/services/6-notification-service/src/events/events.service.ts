import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { Event, EventType } from './entities/event.entity';
import { CreateEventDto } from './dto/event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  /**
   * Get event stream for operations analysis
   * Used by: operations-client.tsx via GET /events/stream
   */
  async getEventStream(limit: number = 50, since?: Date): Promise<Event[]> {
    const query = this.eventRepository.createQueryBuilder('event')
      .orderBy('event.timestamp', 'DESC')
      .take(limit);

    if (since) {
      query.where('event.timestamp > :since', { since });
    }

    return query.getMany();
  }

  /**
   * Get recent events with optional type filter
   */
  async getRecentEvents(limit: number = 50, type?: EventType): Promise<Event[]> {
    const whereCondition = type ? { type } : {};
    
    return this.eventRepository.find({
      where: whereCondition,
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get suspicious and anomalous events
   */
  async getAnomalies(limit: number = 50): Promise<Event[]> {
    return this.eventRepository.find({
      where: [
        { type: EventType.SUSPICIOUS },
        { type: EventType.ANOMALOUS },
      ],
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get events by category
   */
  async getEventsByCategory(category: string, limit: number = 50): Promise<Event[]> {
    return this.eventRepository.find({
      where: { category },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  /**
   * Create a new event
   */
  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(event);
  }

  /**
   * Create multiple events (batch)
   */
  async createEvents(events: CreateEventDto[]): Promise<Event[]> {
    const eventEntities = events.map(dto => this.eventRepository.create(dto));
    return this.eventRepository.save(eventEntities);
  }

  /**
   * Get event statistics
   */
  async getEventStats(): Promise<{
    total: number;
    normal: number;
    suspicious: number;
    anomalous: number;
    last24Hours: number;
  }> {
    const [total, normal, suspicious, anomalous] = await Promise.all([
      this.eventRepository.count(),
      this.eventRepository.count({ where: { type: EventType.NORMAL } }),
      this.eventRepository.count({ where: { type: EventType.SUSPICIOUS } }),
      this.eventRepository.count({ where: { type: EventType.ANOMALOUS } }),
    ]);

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const last24Hours = await this.eventRepository.count({
      where: { timestamp: MoreThan(oneDayAgo) },
    });

    return {
      total,
      normal,
      suspicious,
      anomalous,
      last24Hours,
    };
  }

  /**
   * Delete old events (cleanup)
   */
  async deleteOldEvents(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await this.eventRepository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();
    
    return result.affected || 0;
  }
}