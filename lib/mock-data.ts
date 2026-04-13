// Mock Data for DSM Dashboard

export interface District {
  id: string;
  name: string;
  phase: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  status: "red" | "yellow" | "green" | "blue";
  riskDriver1: string;
  riskDriver2: string;
  daysLeft: number | null;
  lastUpdated: string;
  hasActiveAlerts: boolean;
  // Phase-specific metrics
  metrics: {
    // Phase 1
    rosteringApproved?: boolean;
    techSetupComplete?: boolean;
    boyWindowScheduled?: boolean;
    teacherLoginPercent?: number;
    // Phase 2
    boyCompletionPercent?: number;
    plp1GenerationPercent?: number;
    plp1DistrictAvgNorm?: number;
    pdScheduledPercent?: number;
    // Phase 3
    moyCompletionPercent?: number;
    studentsTested?: number;
    totalStudents?: number;
    schoolsBelow70?: number;
    // Phase 4
    plp2CompletionPercent?: number;
    bonusTrekPercent?: number;
    a2lParticipationPercent?: number;
    // Phase 5
    finalPlpCompletionPercent?: number;
    a2lPlpCompletionPercent?: number;
  };
  schools: School[];
}

export interface School {
  id: string;
  name: string;
  completionPercent: number;
  studentsTested: number;
  totalStudents: number;
  daysLeft: number | null;
  status: "red" | "yellow" | "green" | "blue";
  teachers: Teacher[];
}

export interface Teacher {
  id: string;
  name: string;
  completionPercent: number;
  studentsTested: number;
  totalStudents: number;
}

export interface Alert {
  id: string;
  severity: "red" | "yellow";
  districtId: string;
  districtName: string;
  phase: 1 | 2 | 3 | 4 | 5;
  triggerCondition: string;
  kpiValue: string;
  timestamp: string;
  isRead: boolean;
}

// Mock Districts Data for Portfolio view (risk-prioritized)
export const mockDistricts: District[] = [
  {
    id: "d1",
    name: "Houston ISD",
    phase: 3,
    riskScore: 92,
    status: "red",
    riskDriver1: "MOY <50% with 3 days left",
    riskDriver2: "12 schools below 70%",
    daysLeft: 3,
    lastUpdated: "1h ago",
    hasActiveAlerts: true,
    metrics: {
      moyCompletionPercent: 42,
      studentsTested: 2100,
      totalStudents: 5000,
      schoolsBelow70: 12,
    },
    schools: [
      {
        id: "s1",
        name: "Lincoln Elementary",
        completionPercent: 28,
        studentsTested: 84,
        totalStudents: 300,
        daysLeft: 3,
        status: "red",
        teachers: [
          { id: "t1", name: "Ms. Rodriguez", completionPercent: 15, studentsTested: 3, totalStudents: 20 },
          { id: "t2", name: "Mr. Chen", completionPercent: 35, studentsTested: 7, totalStudents: 20 },
          { id: "t3", name: "Ms. Johnson", completionPercent: 40, studentsTested: 8, totalStudents: 20 },
        ],
      },
      {
        id: "s2",
        name: "Washington Middle",
        completionPercent: 45,
        studentsTested: 225,
        totalStudents: 500,
        daysLeft: 3,
        status: "red",
        teachers: [
          { id: "t4", name: "Mr. Williams", completionPercent: 30, studentsTested: 9, totalStudents: 30 },
          { id: "t5", name: "Ms. Davis", completionPercent: 55, studentsTested: 17, totalStudents: 31 },
        ],
      },
    ],
  },
  {
    id: "d2",
    name: "Fort Worth ISD",
    phase: 3,
    riskScore: 88,
    status: "red",
    riskDriver1: "MOY <70% with 6 days left",
    riskDriver2: "8 schools below 70%",
    daysLeft: 6,
    lastUpdated: "4h ago",
    hasActiveAlerts: true,
    metrics: {
      moyCompletionPercent: 58,
      studentsTested: 1740,
      totalStudents: 3000,
      schoolsBelow70: 8,
    },
    schools: [
      {
        id: "s3",
        name: "Fort Worth Elementary",
        completionPercent: 52,
        studentsTested: 130,
        totalStudents: 250,
        daysLeft: 6,
        status: "yellow",
        teachers: [
          { id: "t6", name: "Ms. Brown", completionPercent: 45, studentsTested: 9, totalStudents: 20 },
          { id: "t7", name: "Mr. Garcia", completionPercent: 60, studentsTested: 12, totalStudents: 20 },
        ],
      },
    ],
  },
  {
    id: "d3",
    name: "Oakwood ISD",
    phase: 2,
    riskScore: 85,
    status: "red",
    riskDriver1: "BOY <50%",
    riskDriver2: "PLP-1 vs Norm -15%",
    daysLeft: 10,
    lastUpdated: "1h ago",
    hasActiveAlerts: true,
    metrics: {
      boyCompletionPercent: 45,
      plp1GenerationPercent: 38,
      plp1DistrictAvgNorm: -15,
      pdScheduledPercent: 60,
    },
    schools: [
      {
        id: "s4",
        name: "Oakwood Elementary",
        completionPercent: 40,
        studentsTested: 160,
        totalStudents: 400,
        daysLeft: 10,
        status: "red",
        teachers: [
          { id: "t8", name: "Ms. Martinez", completionPercent: 35, studentsTested: 7, totalStudents: 20 },
        ],
      },
    ],
  },
  {
    id: "d4",
    name: "Brownsville ISD",
    phase: 3,
    riskScore: 82,
    status: "red",
    riskDriver1: "MOY <60% with 5 days left",
    riskDriver2: "6 schools below 70%",
    daysLeft: 5,
    lastUpdated: "2d ago",
    hasActiveAlerts: true,
    metrics: {
      moyCompletionPercent: 55,
      studentsTested: 1650,
      totalStudents: 3000,
      schoolsBelow70: 6,
    },
    schools: [],
  },
  {
    id: "d5",
    name: "Austin ISD",
    phase: 2,
    riskScore: 72,
    status: "yellow",
    riskDriver1: "PD Scheduled <100%",
    riskDriver2: "BOY 72% complete",
    daysLeft: 8,
    lastUpdated: "2h ago",
    hasActiveAlerts: false,
    metrics: {
      boyCompletionPercent: 72,
      plp1GenerationPercent: 65,
      plp1DistrictAvgNorm: 2,
      pdScheduledPercent: 75,
    },
    schools: [
      {
        id: "s5",
        name: "Austin Elementary",
        completionPercent: 68,
        studentsTested: 170,
        totalStudents: 250,
        daysLeft: 8,
        status: "yellow",
        teachers: [],
      },
    ],
  },
  {
    id: "d6",
    name: "San Antonio ISD",
    phase: 1,
    riskScore: 68,
    status: "yellow",
    riskDriver1: "Rostering incomplete",
    riskDriver2: "Teacher Login <80%",
    daysLeft: null,
    lastUpdated: "2d ago",
    hasActiveAlerts: true,
    metrics: {
      rosteringApproved: false,
      techSetupComplete: true,
      boyWindowScheduled: true,
      teacherLoginPercent: 65,
    },
    schools: [],
  },
  {
    id: "d7",
    name: "Laredo ISD",
    phase: 2,
    riskScore: 55,
    status: "yellow",
    riskDriver1: "PLP-2 at 68%",
    riskDriver2: "A2L Participation 70%",
    daysLeft: null,
    lastUpdated: "5d ago",
    hasActiveAlerts: false,
    metrics: {
      plp2CompletionPercent: 68,
      bonusTrekPercent: 45,
      a2lParticipationPercent: 70,
    },
    schools: [],
  },
  {
    id: "d8",
    name: "El Paso ISD",
    phase: 4,
    riskScore: 35,
    status: "green",
    riskDriver1: "PLP-2 85% complete",
    riskDriver2: "On track",
    daysLeft: 14,
    lastUpdated: "1d ago",
    hasActiveAlerts: false,
    metrics: {
      plp2CompletionPercent: 85,
      bonusTrekPercent: 78,
      a2lParticipationPercent: 88,
    },
    schools: [
      {
        id: "s7",
        name: "El Paso Elementary",
        completionPercent: 88,
        studentsTested: 220,
        totalStudents: 250,
        daysLeft: 14,
        status: "green",
        teachers: [],
      },
    ],
  },
  {
    id: "d9",
    name: "Arlington ISD",
    phase: 4,
    riskScore: 28,
    status: "green",
    riskDriver1: "PLP-2 92% complete",
    riskDriver2: "A2L on track",
    daysLeft: 5,
    lastUpdated: "1d ago",
    hasActiveAlerts: false,
    metrics: {
      plp2CompletionPercent: 92,
      bonusTrekPercent: 88,
      a2lParticipationPercent: 94,
    },
    schools: [],
  },
  {
    id: "d10",
    name: "Plano ISD",
    phase: 2,
    riskScore: 25,
    status: "green",
    riskDriver1: "BOY 94% complete",
    riskDriver2: "PLP-1 on track",
    daysLeft: null,
    lastUpdated: "3d ago",
    hasActiveAlerts: false,
    metrics: {
      boyCompletionPercent: 94,
      plp1GenerationPercent: 91,
      plp1DistrictAvgNorm: 8,
      pdScheduledPercent: 100,
    },
    schools: [],
  },
  {
    id: "d11",
    name: "Corpus Christi ISD",
    phase: 5,
    riskScore: 8,
    status: "blue",
    riskDriver1: "All targets met",
    riskDriver2: "Phase complete",
    daysLeft: null,
    lastUpdated: "1d ago",
    hasActiveAlerts: false,
    metrics: {
      finalPlpCompletionPercent: 100,
      a2lPlpCompletionPercent: 98,
    },
    schools: [],
  },
];

// District Portfolio Management Data (11 Texas districts)
export interface PortfolioDistrict {
  id: string;
  name: string;
  state: string;
  phase: 1 | 2 | 3 | 4 | 5;
  riskStatus: "red" | "yellow" | "green" | "blue";
  trackingStatus: "active" | "paused";
  assignedDSM: string;
  lastUpdated: string;
}

export const portfolioDistricts: PortfolioDistrict[] = [
  { id: "pd1", name: "Houston ISD", state: "TX", phase: 3, riskStatus: "red", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "1h ago" },
  { id: "pd2", name: "Austin ISD", state: "TX", phase: 2, riskStatus: "yellow", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "2h ago" },
  { id: "pd3", name: "San Antonio ISD", state: "TX", phase: 1, riskStatus: "yellow", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "2d ago" },
  { id: "pd4", name: "Fort Worth ISD", state: "TX", phase: 3, riskStatus: "red", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "4h ago" },
  { id: "pd5", name: "El Paso ISD", state: "TX", phase: 4, riskStatus: "green", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "1d ago" },
  { id: "pd6", name: "Arlington ISD", state: "TX", phase: 4, riskStatus: "green", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "1d ago" },
  { id: "pd7", name: "Corpus Christi ISD", state: "TX", phase: 5, riskStatus: "blue", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "1d ago" },
  { id: "pd8", name: "Brownsville ISD", state: "TX", phase: 3, riskStatus: "red", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "2d ago" },
  { id: "pd9", name: "Laredo ISD", state: "TX", phase: 2, riskStatus: "yellow", trackingStatus: "paused", assignedDSM: "Sarah", lastUpdated: "5d ago" },
  { id: "pd10", name: "Plano ISD", state: "TX", phase: 2, riskStatus: "green", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "3d ago" },
  { id: "pd11", name: "Oakwood ISD", state: "TX", phase: 2, riskStatus: "red", trackingStatus: "active", assignedDSM: "Sarah", lastUpdated: "1h ago" },
];

// Mock Alerts Data
export const mockAlerts: Alert[] = [
  {
    id: "a1",
    severity: "red",
    districtId: "d1",
    districtName: "Lincoln Unified",
    phase: 3,
    triggerCondition: "MOY <50% with 3 days left",
    kpiValue: "42%",
    timestamp: "2 hours ago",
    isRead: false,
  },
  {
    id: "a2",
    severity: "red",
    districtId: "d2",
    districtName: "Riverside Academy",
    phase: 3,
    triggerCondition: "MOY <70% with 7 days left",
    kpiValue: "58%",
    timestamp: "4 hours ago",
    isRead: false,
  },
  {
    id: "a3",
    severity: "red",
    districtId: "d3",
    districtName: "Oakwood ISD",
    phase: 2,
    triggerCondition: "BOY <50%",
    kpiValue: "45%",
    timestamp: "1 hour ago",
    isRead: false,
  },
  {
    id: "a4",
    severity: "yellow",
    districtId: "d4",
    districtName: "Maple Grove Schools",
    phase: 1,
    triggerCondition: "Rostering incomplete",
    kpiValue: "Pending",
    timestamp: "3 hours ago",
    isRead: true,
  },
  {
    id: "a5",
    severity: "yellow",
    districtId: "d5",
    districtName: "Valley Central",
    phase: 2,
    triggerCondition: "PD Scheduled <100%",
    kpiValue: "75%",
    timestamp: "5 hours ago",
    isRead: true,
  },
  {
    id: "a6",
    severity: "yellow",
    districtId: "d6",
    districtName: "Sunrise District",
    phase: 3,
    triggerCondition: "4 schools below 70%",
    kpiValue: "4 schools",
    timestamp: "6 hours ago",
    isRead: true,
  },
  {
    id: "a7",
    severity: "yellow",
    districtId: "d7",
    districtName: "Hillcrest Academy",
    phase: 4,
    triggerCondition: "PLP-2 below target",
    kpiValue: "68%",
    timestamp: "8 hours ago",
    isRead: true,
  },
];

// KPI Summary Data
export const kpiSummary = {
  highRiskDistricts: mockDistricts.filter(d => d.status === "red").length,
  testWindowsClosingSoon: mockDistricts.filter(d => d.daysLeft !== null && d.daysLeft <= 7).length,
  plpCompletionAtRisk: mockDistricts.filter(d => d.phase === 2 && d.metrics.plp1GenerationPercent && d.metrics.plp1GenerationPercent < 70).length,
  pdSchedulingAtRisk: mockDistricts.filter(d => d.metrics.pdScheduledPercent && d.metrics.pdScheduledPercent < 100).length,
  activeAlerts: mockAlerts.filter(a => !a.isRead).length,
  totalDistricts: mockDistricts.length,
};

// Notification Settings
export interface NotificationSetting {
  id: string;
  category: string;
  alertType: string;
  inApp: boolean;
  email: boolean;
}

export const notificationSettings: NotificationSetting[] = [
  { id: "n1", category: "Testing Windows", alertType: "Test window closing in 7 days", inApp: true, email: true },
  { id: "n2", category: "Testing Windows", alertType: "Test window closing in 3 days", inApp: true, email: true },
  { id: "n3", category: "Testing Windows", alertType: "Completion below 70% with <7 days", inApp: true, email: true },
  { id: "n4", category: "Testing Windows", alertType: "Completion below 50%", inApp: true, email: true },
  { id: "n5", category: "PLP Progress", alertType: "PLP generation stalled 5+ days", inApp: true, email: false },
  { id: "n6", category: "PLP Progress", alertType: "PLP below district norm", inApp: true, email: false },
  { id: "n7", category: "Onboarding", alertType: "Rostering incomplete after 7 days", inApp: true, email: true },
  { id: "n8", category: "Onboarding", alertType: "Teacher login below 80%", inApp: true, email: false },
  { id: "n9", category: "Escalation Thresholds", alertType: "District enters Red status", inApp: true, email: true },
  { id: "n10", category: "Escalation Thresholds", alertType: "Risk score increases by 20+", inApp: true, email: true },
];
