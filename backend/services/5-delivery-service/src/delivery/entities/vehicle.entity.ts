import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
  } from 'typeorm';
  
  export enum VehicleStatus {
    AVAILABLE = 'AVAILABLE',
    IN_USE = 'IN_USE',
    MAINTENANCE = 'MAINTENANCE',
    OUT_OF_SERVICE = 'OUT_OF_SERVICE',
    RETIRED = 'RETIRED',
  }
  
  export enum VehicleCategory {
    BIKE = 'BIKE',
    MOTORCYCLE = 'MOTORCYCLE',
    CAR = 'CAR',
    VAN = 'VAN',
    SMALL_TRUCK = 'SMALL_TRUCK',
    LARGE_TRUCK = 'LARGE_TRUCK',
    REFRIGERATED_VAN = 'REFRIGERATED_VAN',
    REFRIGERATED_TRUCK = 'REFRIGERATED_TRUCK',
  }
  
  export enum FuelType {
    GASOLINE = 'GASOLINE',
    DIESEL = 'DIESEL',
    ELECTRIC = 'ELECTRIC',
    HYBRID = 'HYBRID',
    CNG = 'CNG',
  }
  
  @Entity('vehicles')
  @Index(['status'])
  @Index(['licensePlate'], { unique: true })
  export class Vehicle {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ type: 'varchar', length: 50, unique: true })
    vehicleNumber: string;
  
    @Column({ type: 'varchar', length: 20, unique: true })
    licensePlate: string;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    vin: string;
  
    @Column({
      type: 'enum',
      enum: VehicleCategory,
      default: VehicleCategory.VAN,
    })
    category: VehicleCategory;
  
    @Column({
      type: 'enum',
      enum: VehicleStatus,
      default: VehicleStatus.AVAILABLE,
    })
    @Index()
    status: VehicleStatus;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    make: string;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    model: string;
  
    @Column({ type: 'int', nullable: true })
    year: number;
  
    @Column({ type: 'varchar', length: 50, nullable: true })
    color: string;
  
    @Column({
      type: 'enum',
      enum: FuelType,
      default: FuelType.GASOLINE,
    })
    fuelType: FuelType;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxWeightKg: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maxVolumeM3: number;
  
    @Column({ type: 'int', nullable: true })
    maxPackages: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    cargoLengthM: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    cargoWidthM: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    cargoHeightM: number;
  
    @Column({ type: 'boolean', default: false })
    hasRefrigeration: boolean;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    minTemperature: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    maxTemperature: number;
  
    @Column({ type: 'boolean', default: false })
    hasLiftGate: boolean;
  
    @Column({ type: 'boolean', default: false })
    hasGPS: boolean;
  
    @Column({ type: 'boolean', default: false })
    hasDashCam: boolean;
  
    @Column({ type: 'boolean', default: false })
    canTransportHazmat: boolean;
  
    @Column({ type: 'uuid', nullable: true })
    assignedDriverId: string;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    assignedDriverName: string;
  
    @Column({ type: 'uuid', nullable: true })
    currentRouteId: string;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLatitude: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    currentLongitude: number;
  
    @Column({ type: 'timestamp', nullable: true })
    lastLocationUpdate: Date;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    currentOdometerKm: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    fuelCapacityLiters: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    currentFuelLevel: number;
  
    @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
    averageFuelConsumption: number;
  
    @Column({ type: 'date', nullable: true })
    lastMaintenanceDate: Date;
  
    @Column({ type: 'date', nullable: true })
    nextMaintenanceDate: Date;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    lastMaintenanceOdometerKm: number;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    maintenanceIntervalKm: number;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    insurancePolicy: string;
  
    @Column({ type: 'date', nullable: true })
    insuranceExpiry: Date;
  
    @Column({ type: 'date', nullable: true })
    registrationExpiry: Date;
  
    @Column({ type: 'date', nullable: true })
    inspectionExpiry: Date;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    purchasePrice: number;
  
    @Column({ type: 'date', nullable: true })
    purchaseDate: Date;
  
    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    monthlyLeaseCost: number;
  
    @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
    costPerKm: number;
  
    @Column({ type: 'int', default: 0 })
    totalTrips: number;
  
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalDistanceKm: number;
  
    @Column({ type: 'int', default: 0 })
    totalDeliveries: number;
  
    @Column({ type: 'uuid', nullable: true })
    homeWarehouseId: string;
  
    @Column({ type: 'varchar', length: 100, nullable: true })
    homeWarehouseName: string;
  
    @Column({ type: 'text', nullable: true })
    notes: string;
  
    @Column({ type: 'simple-array', nullable: true })
    features: string[];
  
    @Column({ type: 'boolean', default: true })
    isActive: boolean;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }