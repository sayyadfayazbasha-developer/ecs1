export interface EmergencyCall {
  id: string;
  text: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  sentiment: 'negative' | 'neutral' | 'positive';
  sentimentScore: number;
  topics: string[];
  timestamp: Date;
}

export const emergencyCalls: EmergencyCall[] = [
  {
    id: '1',
    text: "Help my house is on fire please send someone quickly its spreading fast",
    urgency: 'high',
    sentiment: 'negative',
    sentimentScore: -0.85,
    topics: ['fire', 'emergency', 'rescue'],
    timestamp: new Date('2024-01-15T08:30:00'),
  },
  {
    id: '2',
    text: "There's been a car accident on highway 101 multiple people injured need ambulance",
    urgency: 'high',
    sentiment: 'negative',
    sentimentScore: -0.78,
    topics: ['accident', 'medical', 'highway'],
    timestamp: new Date('2024-01-15T09:15:00'),
  },
  {
    id: '3',
    text: "Someone broke into my house I'm hiding in the closet please hurry",
    urgency: 'high',
    sentiment: 'negative',
    sentimentScore: -0.92,
    topics: ['break-in', 'safety', 'police'],
    timestamp: new Date('2024-01-15T10:00:00'),
  },
  {
    id: '4',
    text: "My child is not breathing I need help right now please",
    urgency: 'critical',
    sentiment: 'negative',
    sentimentScore: -0.98,
    topics: ['medical', 'child', 'breathing'],
    timestamp: new Date('2024-01-15T10:45:00'),
  },
  {
    id: '5',
    text: "I want to report a noise complaint my neighbor is playing loud music",
    urgency: 'low',
    sentiment: 'neutral',
    sentimentScore: -0.15,
    topics: ['noise', 'complaint', 'neighbor'],
    timestamp: new Date('2024-01-15T11:30:00'),
  },
  {
    id: '6',
    text: "There's a suspicious person walking around the neighborhood",
    urgency: 'low',
    sentiment: 'neutral',
    sentimentScore: -0.25,
    topics: ['suspicious', 'patrol', 'safety'],
    timestamp: new Date('2024-01-15T12:00:00'),
  },
  {
    id: '7',
    text: "My grandmother fell and can't get up she might have broken her hip",
    urgency: 'medium',
    sentiment: 'negative',
    sentimentScore: -0.65,
    topics: ['fall', 'elderly', 'medical'],
    timestamp: new Date('2024-01-15T12:45:00'),
  },
  {
    id: '8',
    text: "I see smoke coming from the building next door it could be a fire",
    urgency: 'high',
    sentiment: 'negative',
    sentimentScore: -0.72,
    topics: ['fire', 'smoke', 'building'],
    timestamp: new Date('2024-01-15T13:30:00'),
  },
  {
    id: '9',
    text: "Someone stole my bicycle from the front yard earlier today",
    urgency: 'low',
    sentiment: 'neutral',
    sentimentScore: -0.30,
    topics: ['theft', 'property', 'report'],
    timestamp: new Date('2024-01-15T14:00:00'),
  },
  {
    id: '10',
    text: "There's a gas leak in my apartment I can smell it strongly",
    urgency: 'high',
    sentiment: 'negative',
    sentimentScore: -0.82,
    topics: ['gas', 'leak', 'hazard'],
    timestamp: new Date('2024-01-15T14:30:00'),
  },
  {
    id: '11',
    text: "I'm having chest pains and difficulty breathing need medical help",
    urgency: 'critical',
    sentiment: 'negative',
    sentimentScore: -0.95,
    topics: ['chest', 'breathing', 'medical'],
    timestamp: new Date('2024-01-15T15:00:00'),
  },
  {
    id: '12',
    text: "A tree fell on power lines and there are sparks flying everywhere",
    urgency: 'high',
    sentiment: 'negative',
    sentimentScore: -0.75,
    topics: ['power', 'tree', 'electrical'],
    timestamp: new Date('2024-01-15T15:30:00'),
  },
  {
    id: '13',
    text: "I found a lost dog and want to report it",
    urgency: 'low',
    sentiment: 'neutral',
    sentimentScore: 0.10,
    topics: ['animal', 'lost', 'report'],
    timestamp: new Date('2024-01-15T16:00:00'),
  },
  {
    id: '14',
    text: "There's flooding in the basement and water is rising fast",
    urgency: 'medium',
    sentiment: 'negative',
    sentimentScore: -0.58,
    topics: ['flood', 'water', 'property'],
    timestamp: new Date('2024-01-15T16:30:00'),
  },
  {
    id: '15',
    text: "I heard gunshots near the park people are running away screaming",
    urgency: 'critical',
    sentiment: 'negative',
    sentimentScore: -0.99,
    topics: ['gunshots', 'danger', 'police'],
    timestamp: new Date('2024-01-15T17:00:00'),
  },
];

export const urgencyDistribution = [
  { name: 'Critical', value: 3, color: 'hsl(0, 85%, 60%)' },
  { name: 'High', value: 6, color: 'hsl(25, 95%, 55%)' },
  { name: 'Medium', value: 2, color: 'hsl(45, 95%, 55%)' },
  { name: 'Low', value: 4, color: 'hsl(142, 70%, 45%)' },
];

export const sentimentDistribution = [
  { name: 'Negative', value: 12, color: 'hsl(0, 72%, 55%)' },
  { name: 'Neutral', value: 3, color: 'hsl(220, 15%, 50%)' },
  { name: 'Positive', value: 0, color: 'hsl(142, 70%, 45%)' },
];

export const topicWordCloud = [
  { text: 'medical', weight: 5 },
  { text: 'fire', weight: 4 },
  { text: 'emergency', weight: 4 },
  { text: 'police', weight: 3 },
  { text: 'accident', weight: 3 },
  { text: 'breathing', weight: 3 },
  { text: 'safety', weight: 3 },
  { text: 'help', weight: 5 },
  { text: 'rescue', weight: 2 },
  { text: 'danger', weight: 2 },
  { text: 'property', weight: 2 },
  { text: 'report', weight: 2 },
  { text: 'hazard', weight: 2 },
  { text: 'child', weight: 1 },
  { text: 'elderly', weight: 1 },
  { text: 'flood', weight: 1 },
  { text: 'theft', weight: 1 },
  { text: 'noise', weight: 1 },
];

export const modelMetrics = {
  accuracy: 0.8667,
  precision: 0.8542,
  recall: 0.8333,
  f1Score: 0.8436,
  meanSentiment: -0.5827,
  stdSentiment: 0.3421,
  positiveRatio: 0.0667,
  negativeRatio: 0.80,
  neutralRatio: 0.1333,
};

export const timeSeriesData = [
  { time: '08:00', calls: 2, avgUrgency: 2.5 },
  { time: '09:00', calls: 3, avgUrgency: 3.0 },
  { time: '10:00', calls: 4, avgUrgency: 3.5 },
  { time: '11:00', calls: 2, avgUrgency: 1.5 },
  { time: '12:00', calls: 3, avgUrgency: 2.0 },
  { time: '13:00', calls: 5, avgUrgency: 2.8 },
  { time: '14:00', calls: 4, avgUrgency: 2.5 },
  { time: '15:00', calls: 6, avgUrgency: 3.2 },
  { time: '16:00', calls: 3, avgUrgency: 1.8 },
  { time: '17:00', calls: 4, avgUrgency: 3.8 },
];
