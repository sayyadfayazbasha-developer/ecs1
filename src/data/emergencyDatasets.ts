// Information about publicly available NLP datasets for emergency/high-stress communications

export const publicDatasets = [
  {
    name: "ATIS (Airline Travel Information System)",
    description: "Contains spoken language queries with varying levels of urgency and stress patterns",
    url: "https://github.com/Microsoft/CNTK/tree/master/Examples/Text/ATIS",
    relevance: "Good for understanding stress in voice communication patterns",
    format: "Text transcripts with intent labels"
  },
  {
    name: "GoEmotions Dataset (Google)",
    description: "58k Reddit comments labeled with 27 emotion categories including fear, anxiety, distress",
    url: "https://github.com/google-research/google-research/tree/master/goemotions",
    relevance: "Excellent for training sentiment/emotion classifiers",
    format: "CSV with text and multi-label emotions"
  },
  {
    name: "EmoContext (SemEval-2019 Task 3)",
    description: "Conversational dataset with emotion labels: happy, sad, angry, others",
    url: "https://www.humanizing-ai.com/emocontext.html",
    relevance: "Captures emotional dynamics in dialogue",
    format: "Three-turn conversations with emotion labels"
  },
  {
    name: "Crisis NLP Datasets",
    description: "Twitter data from various crisis events (floods, earthquakes, shootings)",
    url: "https://crisisnlp.qcri.org/",
    relevance: "Directly relevant - emergency communications during disasters",
    format: "Tweet IDs with humanitarian labels"
  },
  {
    name: "911 Calls Dataset (Kaggle)",
    description: "Emergency 911 calls metadata from Montgomery County, PA",
    url: "https://www.kaggle.com/datasets/mchirico/montcoalert",
    relevance: "Real emergency call metadata (not transcripts)",
    format: "CSV with call type, location, timestamp"
  },
  {
    name: "IEMOCAP Database",
    description: "Interactive emotional dyadic motion capture database with speech and emotions",
    url: "https://sail.usc.edu/iemocap/",
    relevance: "Multi-modal emotion recognition including distress",
    format: "Audio, video, and transcripts with emotion labels"
  },
  {
    name: "MELD (Multimodal EmotionLines Dataset)",
    description: "Multiparty conversational dataset from TV show Friends with emotion/sentiment labels",
    url: "https://github.com/declare-lab/MELD",
    relevance: "Multi-speaker emotion detection in conversations",
    format: "Video clips with utterance-level emotion/sentiment annotations"
  },
  {
    name: "Disaster Response Messages (Figure Eight)",
    description: "36k messages from disaster events categorized by type and urgency",
    url: "https://appen.com/datasets/combined-disaster-response-data/",
    relevance: "Real disaster messages with urgency classification",
    format: "Text messages with 36 category labels"
  }
];

// Synthetic emergency call transcripts for MEDLDA model testing
export interface SyntheticEmergencyCall {
  id: number;
  transcript: string;
  emotionalTone: 'neutral' | 'distressed' | 'panicked';
  incidentType: string;
  location: string;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
}

export const syntheticEmergencyCalls: SyntheticEmergencyCall[] = [
  // NEUTRAL TONE (Calm, factual reporting)
  {
    id: 1,
    transcript: "I would like to report a minor traffic accident at the intersection of Oak Street and Main Avenue. No injuries, just some property damage to both vehicles. Both drivers are exchanging information.",
    emotionalTone: 'neutral',
    incidentType: 'traffic_accident',
    location: 'Oak Street and Main Avenue',
    urgencyLevel: 'low',
    keywords: ['accident', 'intersection', 'property damage', 'vehicles']
  },
  {
    id: 2,
    transcript: "Hello, I'm calling to report a suspicious vehicle that has been parked outside my neighbor's house for several hours. It's a dark blue sedan with no license plates visible. No one appears to be inside.",
    emotionalTone: 'neutral',
    incidentType: 'suspicious_activity',
    location: 'residential neighborhood',
    urgencyLevel: 'low',
    keywords: ['suspicious', 'vehicle', 'parked', 'sedan']
  },
  {
    id: 3,
    transcript: "I need to report a power line that's down on Riverside Drive near the elementary school. It's not sparking but it's blocking part of the road. I've warned some cars to go around.",
    emotionalTone: 'neutral',
    incidentType: 'utility_emergency',
    location: 'Riverside Drive',
    urgencyLevel: 'medium',
    keywords: ['power line', 'down', 'blocking', 'school']
  },
  {
    id: 4,
    transcript: "Good evening. I'm calling about a noise complaint. My neighbor has been playing very loud music since around ten PM and it's now past midnight. I've already asked them to turn it down twice.",
    emotionalTone: 'neutral',
    incidentType: 'noise_complaint',
    location: 'residential area',
    urgencyLevel: 'low',
    keywords: ['noise', 'complaint', 'music', 'neighbor']
  },
  {
    id: 5,
    transcript: "I found a lost child, approximately five years old, at the shopping mall food court. She says her name is Emma and she can't find her parents. I'm staying with her at the information desk.",
    emotionalTone: 'neutral',
    incidentType: 'lost_child',
    location: 'shopping mall',
    urgencyLevel: 'medium',
    keywords: ['lost child', 'mall', 'parents', 'information desk']
  },
  {
    id: 6,
    transcript: "I'd like to report a tree that has fallen across the road on Highway 42 near mile marker 78. It's completely blocking both lanes. No vehicles were hit but traffic is starting to back up.",
    emotionalTone: 'neutral',
    incidentType: 'road_obstruction',
    location: 'Highway 42, mile marker 78',
    urgencyLevel: 'medium',
    keywords: ['tree', 'fallen', 'blocking', 'highway']
  },
  {
    id: 7,
    transcript: "Hello, I'm reporting what appears to be a small brush fire about half a mile from the Pinecrest trailhead. It's approximately ten by ten feet and doesn't seem to be spreading rapidly at the moment.",
    emotionalTone: 'neutral',
    incidentType: 'fire',
    location: 'Pinecrest trailhead area',
    urgencyLevel: 'high',
    keywords: ['brush fire', 'trailhead', 'spreading', 'feet']
  },
  {
    id: 8,
    transcript: "I need to report a water main break on Commerce Street near the post office. Water is flowing into the street and starting to flood the parking area. No buildings appear affected yet.",
    emotionalTone: 'neutral',
    incidentType: 'utility_emergency',
    location: 'Commerce Street',
    urgencyLevel: 'medium',
    keywords: ['water main', 'break', 'flooding', 'street']
  },
  {
    id: 9,
    transcript: "I'm calling to report an elderly man who appears confused and is wandering in the park near Maple Street. He seems disoriented and keeps asking for directions to a street that doesn't exist here.",
    emotionalTone: 'neutral',
    incidentType: 'welfare_check',
    location: 'park near Maple Street',
    urgencyLevel: 'medium',
    keywords: ['elderly', 'confused', 'wandering', 'disoriented']
  },
  {
    id: 10,
    transcript: "I would like to report a minor gas leak smell coming from the apartment next door. Unit 4B in the Greenview Apartments. The residents don't appear to be home. No visible signs of emergency.",
    emotionalTone: 'neutral',
    incidentType: 'gas_leak',
    location: 'Greenview Apartments, Unit 4B',
    urgencyLevel: 'high',
    keywords: ['gas leak', 'smell', 'apartment', 'residents']
  },
  {
    id: 11,
    transcript: "Calling to report a group of teenagers vandalizing property at the abandoned warehouse on Industrial Boulevard. They're spray painting the walls. About four or five of them.",
    emotionalTone: 'neutral',
    incidentType: 'vandalism',
    location: 'Industrial Boulevard warehouse',
    urgencyLevel: 'low',
    keywords: ['teenagers', 'vandalism', 'spray paint', 'warehouse']
  },
  {
    id: 12,
    transcript: "I need assistance with a vehicle that has broken down on the shoulder of Interstate 95, northbound, near exit 234. The hazard lights are on but the driver appears to need help with a flat tire.",
    emotionalTone: 'neutral',
    incidentType: 'roadside_assistance',
    location: 'Interstate 95 northbound, exit 234',
    urgencyLevel: 'low',
    keywords: ['broken down', 'shoulder', 'hazard lights', 'flat tire']
  },

  // DISTRESSED TONE (Elevated anxiety, concern, urgency)
  {
    id: 13,
    transcript: "Please, you need to send someone quickly! There's been a car accident and one of the drivers is bleeding from their head. They're conscious but they seem really hurt. We're at the corner of Fifth and Washington.",
    emotionalTone: 'distressed',
    incidentType: 'traffic_accident',
    location: 'Fifth and Washington',
    urgencyLevel: 'high',
    keywords: ['accident', 'bleeding', 'head injury', 'conscious', 'hurt']
  },
  {
    id: 14,
    transcript: "Oh my god, there's smoke coming from my kitchen! I think something caught fire in the oven. I turned it off but the smoke is getting thicker. I have kids in the house, what do I do?",
    emotionalTone: 'distressed',
    incidentType: 'fire',
    location: 'residential home',
    urgencyLevel: 'high',
    keywords: ['smoke', 'fire', 'oven', 'kids', 'house']
  },
  {
    id: 15,
    transcript: "I need help, someone broke into my car while I was in the store. They took my laptop and my purse with all my medications inside. I really need those medications. I'm at the parking lot of Westfield Mall.",
    emotionalTone: 'distressed',
    incidentType: 'theft',
    location: 'Westfield Mall parking lot',
    urgencyLevel: 'medium',
    keywords: ['broke into', 'car', 'laptop', 'purse', 'medications']
  },
  {
    id: 16,
    transcript: "Please send an ambulance! My father just collapsed in the living room. He's breathing but he won't wake up. He has a heart condition. Please hurry, I don't know what to do!",
    emotionalTone: 'distressed',
    incidentType: 'medical_emergency',
    location: 'residential home',
    urgencyLevel: 'critical',
    keywords: ['collapsed', 'breathing', 'heart condition', 'ambulance', 'won\'t wake']
  },
  {
    id: 17,
    transcript: "There's a fight happening outside the bar on Seventh Street! Several people are involved and I think I saw someone pull out a knife. People are screaming. Please send police right away!",
    emotionalTone: 'distressed',
    incidentType: 'assault',
    location: 'Seventh Street bar',
    urgencyLevel: 'critical',
    keywords: ['fight', 'knife', 'screaming', 'police', 'bar']
  },
  {
    id: 18,
    transcript: "I can't find my daughter! We were at the county fair and I looked away for just a moment. She's only seven years old, wearing a pink dress. It's been twenty minutes, please help me find her!",
    emotionalTone: 'distressed',
    incidentType: 'missing_child',
    location: 'county fair',
    urgencyLevel: 'critical',
    keywords: ['can\'t find', 'daughter', 'seven years', 'fair', 'pink dress']
  },
  {
    id: 19,
    transcript: "Someone is trying to break into my house! I can hear them at the back door. I'm in my bedroom with my children. I've locked the door but I'm scared. Please send help immediately!",
    emotionalTone: 'distressed',
    incidentType: 'home_invasion',
    location: 'residential home',
    urgencyLevel: 'critical',
    keywords: ['break into', 'house', 'children', 'scared', 'locked']
  },
  {
    id: 20,
    transcript: "My neighbor just had a seizure and she's still shaking on the ground. I don't know how to help her. Her lips are turning blue. She lives alone at 456 Elm Street. Please send medical help!",
    emotionalTone: 'distressed',
    incidentType: 'medical_emergency',
    location: '456 Elm Street',
    urgencyLevel: 'critical',
    keywords: ['seizure', 'shaking', 'blue lips', 'alone', 'medical']
  },
  {
    id: 21,
    transcript: "I think my husband is having a stroke! His face is drooping on one side and he can't lift his right arm. He's trying to talk but the words aren't coming out right. We need an ambulance now!",
    emotionalTone: 'distressed',
    incidentType: 'medical_emergency',
    location: 'residential home',
    urgencyLevel: 'critical',
    keywords: ['stroke', 'face drooping', 'arm', 'words', 'ambulance']
  },
  {
    id: 22,
    transcript: "There's water flooding into my basement and it's rising fast! The sump pump failed during the storm. I have electrical equipment down there. I'm worried about electrocution. What should I do?",
    emotionalTone: 'distressed',
    incidentType: 'flooding',
    location: 'residential basement',
    urgencyLevel: 'high',
    keywords: ['flooding', 'basement', 'sump pump', 'electrical', 'electrocution']
  },
  {
    id: 23,
    transcript: "A dog is attacking a child in the park! The owner can't control it. The child is on the ground and crying. We're at Jefferson Park near the playground. Send help quickly please!",
    emotionalTone: 'distressed',
    incidentType: 'animal_attack',
    location: 'Jefferson Park playground',
    urgencyLevel: 'critical',
    keywords: ['dog', 'attacking', 'child', 'ground', 'crying']
  },
  {
    id: 24,
    transcript: "I smell strong gas inside my apartment building! Multiple residents are complaining. We're evacuating but some elderly people on the third floor need help getting out. Building address is 789 Center Avenue.",
    emotionalTone: 'distressed',
    incidentType: 'gas_leak',
    location: '789 Center Avenue',
    urgencyLevel: 'critical',
    keywords: ['gas', 'apartment', 'evacuating', 'elderly', 'help']
  },
  {
    id: 25,
    transcript: "My teenage son hasn't come home and it's been six hours past his curfew. He's not answering his phone. This isn't like him at all. His friends say they haven't seen him since school ended.",
    emotionalTone: 'distressed',
    incidentType: 'missing_person',
    location: 'unknown',
    urgencyLevel: 'high',
    keywords: ['son', 'hasn\'t come home', 'curfew', 'phone', 'school']
  },

  // PANICKED TONE (Extreme fear, crisis mode, life-threatening)
  {
    id: 26,
    transcript: "HELP! HELP! The building is on fire! There are flames everywhere and people are trapped on the upper floors! I can see them at the windows screaming! Send everyone, please! This is the Parkview Tower on Central!",
    emotionalTone: 'panicked',
    incidentType: 'fire',
    location: 'Parkview Tower, Central',
    urgencyLevel: 'critical',
    keywords: ['fire', 'flames', 'trapped', 'windows', 'screaming']
  },
  {
    id: 27,
    transcript: "OH GOD HE'S GOT A GUN! There's a man with a gun in the store! Everyone is hiding! He's shooting! I'm under a table, please help us, please! It's the grocery store on Market Street!",
    emotionalTone: 'panicked',
    incidentType: 'active_shooter',
    location: 'grocery store, Market Street',
    urgencyLevel: 'critical',
    keywords: ['gun', 'shooting', 'hiding', 'help', 'store']
  },
  {
    id: 28,
    transcript: "MY BABY ISN'T BREATHING! Please, please help me! She was fine one minute and now she's blue! I don't know CPR! What do I do?! Someone please tell me what to do! She's only three months old!",
    emotionalTone: 'panicked',
    incidentType: 'medical_emergency',
    location: 'residential home',
    urgencyLevel: 'critical',
    keywords: ['baby', 'not breathing', 'blue', 'CPR', 'three months']
  },
  {
    id: 29,
    transcript: "THE CAR IS SINKING! We drove off the bridge into the water! Water is coming in! My kids are in the back! I can't get the doors open! Help us please! We're in the river near Highway 9 bridge!",
    emotionalTone: 'panicked',
    incidentType: 'water_rescue',
    location: 'Highway 9 bridge river',
    urgencyLevel: 'critical',
    keywords: ['sinking', 'water', 'kids', 'doors', 'river']
  },
  {
    id: 30,
    transcript: "HE'S STABBING HER! SOMEONE STOP HIM! There's blood everywhere! We're at the bus station downtown! He won't stop! People are running! Please, PLEASE send help NOW!",
    emotionalTone: 'panicked',
    incidentType: 'violent_assault',
    location: 'downtown bus station',
    urgencyLevel: 'critical',
    keywords: ['stabbing', 'blood', 'bus station', 'running', 'help']
  },
  {
    id: 31,
    transcript: "I CAN'T BREATHE! Something is wrong! My throat is closing up! I think I'm having an allergic reaction! I ate something with peanuts! I don't have my EpiPen! Please send help to 234 Oak Lane!",
    emotionalTone: 'panicked',
    incidentType: 'medical_emergency',
    location: '234 Oak Lane',
    urgencyLevel: 'critical',
    keywords: ['can\'t breathe', 'throat closing', 'allergic', 'peanuts', 'EpiPen']
  },
  {
    id: 32,
    transcript: "THE TORNADO IS RIGHT HERE! It's destroying everything! Houses are being ripped apart! I'm in my bathtub with my family! The roof just came off! We're at 567 Prairie Road! Send rescue teams!",
    emotionalTone: 'panicked',
    incidentType: 'natural_disaster',
    location: '567 Prairie Road',
    urgencyLevel: 'critical',
    keywords: ['tornado', 'destroying', 'houses', 'roof', 'rescue']
  },
  {
    id: 33,
    transcript: "THERE'S A BOMB! Someone left a package and it's making a ticking sound! Everyone is running out of the mall! It's by the fountain in Eastgate Shopping Center! Clear the area! HURRY!",
    emotionalTone: 'panicked',
    incidentType: 'bomb_threat',
    location: 'Eastgate Shopping Center',
    urgencyLevel: 'critical',
    keywords: ['bomb', 'package', 'ticking', 'mall', 'fountain']
  },
  {
    id: 34,
    transcript: "MY HUSBAND JUST SHOT HIMSELF! There's so much blood! He's still alive but barely! Please send an ambulance to 890 Willow Court immediately! I'm trying to stop the bleeding but I don't know if I can!",
    emotionalTone: 'panicked',
    incidentType: 'gunshot_wound',
    location: '890 Willow Court',
    urgencyLevel: 'critical',
    keywords: ['shot', 'blood', 'alive', 'ambulance', 'bleeding']
  },
  {
    id: 35,
    transcript: "THE CRANE COLLAPSED ON THE CONSTRUCTION SITE! Workers are trapped under the debris! I can hear them screaming for help! It's at the new building site on First Avenue! Multiple people are injured!",
    emotionalTone: 'panicked',
    incidentType: 'structural_collapse',
    location: 'First Avenue construction site',
    urgencyLevel: 'critical',
    keywords: ['crane', 'collapsed', 'trapped', 'debris', 'screaming']
  },
  {
    id: 36,
    transcript: "A TRAIN JUST DERAILED! The cars are piling up! I see fire and smoke! There are people inside! It happened at the Jackson crossing! Oh god there are so many people! Send everyone!",
    emotionalTone: 'panicked',
    incidentType: 'train_accident',
    location: 'Jackson crossing',
    urgencyLevel: 'critical',
    keywords: ['train', 'derailed', 'fire', 'smoke', 'people']
  },
  {
    id: 37,
    transcript: "SOMEONE TOOK MY CHILD! A man just grabbed her and drove off! It just happened! She's five years old! He was driving a white van! License plate started with K! We're at Sunset Elementary! PLEASE FIND HER!",
    emotionalTone: 'panicked',
    incidentType: 'kidnapping',
    location: 'Sunset Elementary School',
    urgencyLevel: 'critical',
    keywords: ['took', 'child', 'grabbed', 'white van', 'license plate']
  },
  {
    id: 38,
    transcript: "THE PLANE JUST CRASHED IN THE FIELD! It's on fire! I'm running towards it but the heat is too intense! It's a small aircraft, maybe two or three people inside! We're off Route 44 near Miller Farm!",
    emotionalTone: 'panicked',
    incidentType: 'plane_crash',
    location: 'Route 44, Miller Farm',
    urgencyLevel: 'critical',
    keywords: ['plane', 'crashed', 'fire', 'heat', 'aircraft']
  },

  // Additional mixed emotional tones
  {
    id: 39,
    transcript: "I'm calling about a homeless person who has been sleeping outside our business for several days. We're concerned about their welfare as temperatures are dropping. They don't appear to be responsive today.",
    emotionalTone: 'neutral',
    incidentType: 'welfare_check',
    location: 'business exterior',
    urgencyLevel: 'medium',
    keywords: ['homeless', 'sleeping', 'temperatures', 'not responsive']
  },
  {
    id: 40,
    transcript: "Please help, my grandmother fell down the stairs and she's not moving! She hit her head really hard. I'm afraid to move her. She's 82 years old. We're at 123 Cedar Street apartment 2A!",
    emotionalTone: 'distressed',
    incidentType: 'fall_injury',
    location: '123 Cedar Street, apt 2A',
    urgencyLevel: 'critical',
    keywords: ['grandmother', 'fell', 'stairs', 'head', 'not moving']
  },
  {
    id: 41,
    transcript: "THE CHEMICALS ARE LEAKING! The truck crashed and there's green liquid everywhere! It's burning my eyes! People are coughing! We're on Industrial Highway near the factory! Everyone needs to evacuate!",
    emotionalTone: 'panicked',
    incidentType: 'hazmat',
    location: 'Industrial Highway',
    urgencyLevel: 'critical',
    keywords: ['chemicals', 'leaking', 'burning', 'coughing', 'evacuate']
  },
  {
    id: 42,
    transcript: "I think someone is following me. I've been walking for three blocks and the same car keeps driving slowly behind me. I'm scared to go home. I'm on the corner of Third and Pine right now.",
    emotionalTone: 'distressed',
    incidentType: 'stalking',
    location: 'Third and Pine',
    urgencyLevel: 'high',
    keywords: ['following', 'car', 'slowly', 'scared', 'home']
  },
  {
    id: 43,
    transcript: "A motorcyclist just crashed at high speed! He went off the road and hit a tree! His helmet came off! He's lying there not moving! We're on Mountain Road near the scenic overlook! Please hurry!",
    emotionalTone: 'distressed',
    incidentType: 'motorcycle_accident',
    location: 'Mountain Road scenic overlook',
    urgencyLevel: 'critical',
    keywords: ['motorcyclist', 'crashed', 'tree', 'helmet', 'not moving']
  },
  {
    id: 44,
    transcript: "THERE'S A FIRE AT THE NURSING HOME! The alarms are going off but some residents can't walk! Staff are trying to evacuate but there are too many people! It's Sunshine Care Center on Oak Boulevard!",
    emotionalTone: 'panicked',
    incidentType: 'fire',
    location: 'Sunshine Care Center, Oak Boulevard',
    urgencyLevel: 'critical',
    keywords: ['fire', 'nursing home', 'can\'t walk', 'evacuate', 'residents']
  },
  {
    id: 45,
    transcript: "I'm locked in my car and a man is trying to break the window with a rock! He's demanding my keys! I'm at the ATM at First National Bank! Please send police! He's going to break through!",
    emotionalTone: 'panicked',
    incidentType: 'carjacking',
    location: 'First National Bank ATM',
    urgencyLevel: 'critical',
    keywords: ['locked', 'break window', 'rock', 'keys', 'police']
  },
  {
    id: 46,
    transcript: "I'd like to report a minor fender bender in the Target parking lot. We're exchanging information but the other driver seems very agitated. No injuries, just dented bumpers. Requesting an officer for documentation.",
    emotionalTone: 'neutral',
    incidentType: 'traffic_accident',
    location: 'Target parking lot',
    urgencyLevel: 'low',
    keywords: ['fender bender', 'parking lot', 'agitated', 'dented bumpers']
  },
  {
    id: 47,
    transcript: "My son accidentally swallowed some cleaning fluid! He's crying and says his mouth hurts! I don't know how much he drank! He's four years old! What do I do? Should I make him throw up?",
    emotionalTone: 'distressed',
    incidentType: 'poisoning',
    location: 'residential home',
    urgencyLevel: 'critical',
    keywords: ['swallowed', 'cleaning fluid', 'crying', 'mouth hurts', 'four years']
  },
  {
    id: 48,
    transcript: "THE ESCALATOR MALFUNCTIONED! It suddenly sped up and people fell! There's an elderly woman who's badly hurt at the bottom! We're at Northgate Mall near Macy's! Several people need medical attention!",
    emotionalTone: 'panicked',
    incidentType: 'mechanical_accident',
    location: 'Northgate Mall, near Macy\'s',
    urgencyLevel: 'critical',
    keywords: ['escalator', 'malfunctioned', 'fell', 'hurt', 'medical']
  },
  {
    id: 49,
    transcript: "I'm reporting a group of people dumping what appears to be industrial waste into the creek behind Morrison Park. They have several barrels and I can smell chemicals. I didn't confront them but took photos.",
    emotionalTone: 'neutral',
    incidentType: 'environmental_crime',
    location: 'creek behind Morrison Park',
    urgencyLevel: 'medium',
    keywords: ['dumping', 'industrial waste', 'creek', 'barrels', 'chemicals']
  },
  {
    id: 50,
    transcript: "HELP! My friend just overdosed! She took pills and now she's not responding! Her breathing is really slow! We're at a party at 456 College Avenue! Please send an ambulance! I don't want her to die!",
    emotionalTone: 'panicked',
    incidentType: 'drug_overdose',
    location: '456 College Avenue',
    urgencyLevel: 'critical',
    keywords: ['overdosed', 'pills', 'not responding', 'breathing slow', 'ambulance']
  }
];

// Summary statistics for the synthetic dataset
export const datasetStatistics = {
  totalCalls: 50,
  byEmotionalTone: {
    neutral: 12,
    distressed: 13,
    panicked: 25
  },
  byUrgencyLevel: {
    low: 6,
    medium: 9,
    high: 6,
    critical: 29
  },
  incidentTypes: [
    'traffic_accident', 'suspicious_activity', 'utility_emergency', 'noise_complaint',
    'lost_child', 'road_obstruction', 'fire', 'welfare_check', 'gas_leak', 'vandalism',
    'roadside_assistance', 'theft', 'medical_emergency', 'assault', 'missing_child',
    'home_invasion', 'flooding', 'animal_attack', 'missing_person', 'active_shooter',
    'water_rescue', 'violent_assault', 'natural_disaster', 'bomb_threat', 'gunshot_wound',
    'structural_collapse', 'train_accident', 'kidnapping', 'plane_crash', 'fall_injury',
    'hazmat', 'stalking', 'motorcycle_accident', 'carjacking', 'poisoning',
    'mechanical_accident', 'environmental_crime', 'drug_overdose'
  ]
};
