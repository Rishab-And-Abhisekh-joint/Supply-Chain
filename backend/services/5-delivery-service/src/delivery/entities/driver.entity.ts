import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  export enum DriverStatus {
    AVAILABLE = 'AVAILABLE',
    ON_ROUTE = 'ON_ROUTE',
    ON_BREAK = 'ON_BREAK',
    OFF_DUTY = 'OFF_DUTY',
    UNAVAILABLE = 'UNAVAILABLE',
    INACTIVE = 'INACTIVE',
  }
  
  export enum DriverType {
    FULL_TIME = 'FULL_TIME',
    PART_TIME = 'PART_TIME',
    CONTRACTOR = 'CONTRACTOR',
    TEMPORARY = 'TEMPORARY',
  }
  
  export enum LicenseType {
    STANDARD = 'STANDARD',
    COMMERCIAL = 'COMMERCIAL',
    HAZMAT = 'HAZMAT',
    MOTORCYCLE = 'MOTORCYCLE',
  }
  
  @Entity('drivers')
  @Index(['status'])
  @Index(['employeeId'], { unique: true })
  export class Driver {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 50, unique: true })
    employeeId: string;
  
    @Column({ type: 'varchar', length: 100 })
    firstName: string;
  
    @Column({ type: 'varchar', length: 100 })
    lastName: string;
  
    @Column({ type: 'varchar', length: 255, nullable: true })
    email: string;
  
    @Column({ type: 'varchar', length: 20 })
    phone: string;
  
    @Column({ type: 'varchar', length: 20, nullable: true })
    emergencyPhone: string;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    emergencyContact: string;
  
    @Column({
      type: 'enum',
      enum: DriverStatus,
      default: DriverStatus.OFF_DUTY,
    })
    @Index()
    status: DriverStatus;
  
    @Column({
      type: 'enum',
      enum: DriverType,
      default: DriverType.FULL_TIME,
    })
    driverType: DriverType;
  
    // License information
    @Column({ type: 'varchar', length: 50, nullable: true })
    licenseNumber: string;
  
    @Column({
      type: 'enum',
      enum: LicenseType,
      default: LicenseType.STANDARD,
    })
    licenseType: LicenseType;
  
    @Column({ type: 'date', nullable: true })
    licenseExpiry: Date;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    licenseState: string;
  
    // Vehicle assignment
    @Column({ type: 'uuid', nullable: true })
    assignedVehicleId: string;
  
    @Column({ type: 'varchar', length: 20, nullable: true })
    assignedVehiclePlate: string;
  
    // Capabilities
    @Column({ type: 'boolean', default: false })
    canHandleHazmat: boolean;
  
    @Column({ type: 'boolean', default: false })
    canHandleRefrigerated: boolean;
  
    @Column({ type: 'boolean', default: false })
    canHandleOversized: boolean;
  
    @Column({ type: 'boolean', default: true })
    canHandleCOD: boolean;
  
    @Column({ type: 'simple-array', nullable: true })
    certifications: string[];
  
    // Work preferences
    @Column({ type: 'simple-array', nullable: true })
    preferredZones: string[];
  
    @Column({ type: 'int', default: 8 })
    maxHoursPerDay: number;
  
    @Column({ type: 'int', nullable: true })
    maxStopsPerDay: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxDistancePerDayKm: number;
  
    // Current location
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLatitude: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLongitude: number;
  
    @Column({ type: 'timestamp', nullable: true })
    lastLocationUpdate: Date;
  
    // Performance metrics
    @Column({ type: 'decimal', precision: 5, scale: 2, default: 100 })
    deliverySuccessRate: number;
  
    @Column({ type: 'decimal', precision: 3, scale: 2, default: 5 })
    averageRating: number;
  
    @Column({ type: 'int', default: 0 })
    totalDeliveries: number;
  
    @Column({ type: 'int', default: 0 })
    onTimeDeliveries: number;
  
    @Column({ type: 'int', default: 0 })
    totalRatings: number;
  
    @Column({ type: 'int', default: 0 })
    totalComplaints: number;
  
    // Shift information
    @Column({ type: 'time', nullable: true })
    defaultShiftStart: string;
  
    @Column({ type: 'time', nullable: true })
    defaultShiftEnd: string;
  
    @Column({ type: 'simple-array', nullable: true })
    workDays: string[];
  
    // Current shift
    @Column({ type: 'timestamp', nullable: true })
    shiftStartTime: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    shiftEndTime: Date;
  
    @Column({ type: 'timestamp', nullable: true })
    lastBreakTime: Date;
  
    @Column({ type: 'int', default: 0 })
    breakMinutesToday: number;
  
    // Address
    @Column({ type: 'text', nullable: true })
    homeAddress: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    homeLatitude: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    homeLongitude: number;
  
    // App and device
    @Column({ type: 'varchar', length: 100, nullable: true })
    deviceId: string;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    appVersion: string;
  
    @Column({ type: 'timestamp', nullable: true })
    lastAppActivity: Date;
  
    // Notes
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    // Dates
    @Column({ type: 'date', nullable: true })
    hireDate: Date;
  
    @Column({ type: 'date', nullable: true })
    terminationDate: Date;
  
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }