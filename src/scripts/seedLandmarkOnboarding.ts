import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Landmark } from '../models/Landmark.js';
import { clearCachePattern } from '../utils/redisUtils.js';
import { bumpTourManifest } from '../utils/tourManifest.js';

const ONBOARDING_DEFAULTS: Record<string, {
  era: string;
  builders: string;
  historicalSummary: string;
  securityGuidelines: string[];
  levelHighlights: string[];
  audioIntroText: string;
}> = {
  colosseum: {
    era: '70 – 80 AD (Flavian Dynasty)',
    builders: 'Emperor Vespasian, completed by Titus',
    historicalSummary:
      'Commissioned in 70 AD by Emperor Vespasian and inaugurated in 80 AD by Titus with 100 days of games. The largest stone amphitheatre in the Roman Empire, engineered with travertine limestone, tufa, and concrete to seat over 50,000 spectators for gladiatorial battles and public spectacles.',
    securityGuidelines: [
      'Valid ticket and official government photo ID must match and be presented at the gate.',
      'Backpacks and bags exceeding 30×30×15 cm are strictly prohibited (no luggage storage on site).',
      'Glass bottles, alcoholic beverages, sharp objects, and selfie sticks are not permitted.',
      'All visitors must pass through security screening and metal detectors prior to entry.',
    ],
    levelHighlights: [
      'Level 0: Hypogeum (Subterranean staging area, animal cages, and elevator lifts)',
      'Level 1: Arena Floor & Lower Cavea (Imperial box and equestrian seating tiers)',
      'Level 2: Museum & Exhibition Galleries (Historical artifacts, models, and Colosseum history)',
      'Level 3: Upper Belvedere (Panoramic terraces overlooking the Roman Forum and city)',
    ],
    audioIntroText:
      'Welcome to the Flavian Amphitheatre, universally known as the Colosseum. Commissioned in 70 AD by Emperor Vespasian and inaugurated in 80 AD by his son Titus, this marvel seated over 50,000 Romans. Before entering the security gates, please ensure your photo ID and ticket voucher are ready. Large bags exceeding 30 centimeters are strictly prohibited. Once inside, you can explore the subterranean Hypogeum, the grand Arena floor, and the panoramic exhibition galleries.',
  },
  arch_of_constantine: {
    era: '315 AD (Late Roman Empire)',
    builders: 'Roman Senate, dedicated to Emperor Constantine I',
    historicalSummary:
      'A monumental triumphal arch erected to celebrate Constantine I’s victory over Maxentius at the Battle of the Milvian Bridge in 312 AD. Incorporates relief sculptures and architectural spolia from earlier monuments of Trajan, Hadrian, and Marcus Aurelius.',
    securityGuidelines: [
      'Outdoor open-air monument located on Via Triumphalis; open access with no entry fee.',
      'Do not cross low preservation barriers or touch ancient marble reliefs.',
      'Commercial photography and drone flights require authorized park permits.',
    ],
    levelHighlights: [
      'Attic Inscription: Dedication to Emperor Constantine and divine inspiration',
      'Central Archway: Massive marble vault spanning the historic triumphal processional route',
      'Spolia Medallions: Hadrianic hunting roundels and Trajanic battle reliefs',
    ],
    audioIntroText:
      'Standing before you is the Arch of Constantine, erected by the Roman Senate in 315 AD to commemorate Constantine’s triumph at the Milvian Bridge. Notice the intricate marble panels reused from the monuments of emperors Trajan, Hadrian, and Marcus Aurelius, symbolizing imperial continuity. Respect preservation cordons while admiring this triumphal gateway.',
  },
  ludus_magnus: {
    era: '81 – 96 AD (Flavian Dynasty)',
    builders: 'Emperor Domitian',
    historicalSummary:
      'The principal gladiatorial training school of ancient Rome, featuring a miniature arena surrounded by housing barracks, storerooms, and weapon armories. Directly linked to the Colosseum by an underground tunnel beneath Via Labicana.',
    securityGuidelines: [
      'Visible from street level along Via di San Giovanni in Laterano and Via Labicana.',
      'Archaeological pit is protected by iron railings; do not lean over or drop objects.',
      'Access inside the ruins is restricted to special archaeological study permits.',
    ],
    levelHighlights: [
      'Training Arena: Elliptical practice ground replicating the Colosseum arena floor',
      'Barracks Cells: Remains of small lodging chambers for gladiator athletes',
      'Subterranean Tunnel: Historic connecting passage to the Colosseum basement',
    ],
    audioIntroText:
      'You are viewing the Ludus Magnus, the premier gladiatorial training complex of ancient Rome. Built by Emperor Domitian, it housed hundreds of gladiators who trained in this miniature arena before fighting in the Colosseum. A subterranean passage once connected these barracks directly to the amphitheatre hypogeum. Please enjoy the view from the pedestrian terrace.',
  },
  temple_venus_rome: {
    era: '121 – 135 AD (Hadrianic Era)',
    builders: 'Emperor Hadrian',
    historicalSummary:
      'The largest temple of ancient Rome, designed by Emperor Hadrian on the Velian Hill overlooking the Colosseum. Dedicated to Venus Felix (ancestress of Rome) and Roma Aeterna (personification of the city), featuring two back-to-back cellae with coffered barrel vaults.',
    securityGuidelines: [
      'Included in standard Colosseum and Archaeological Park tickets.',
      'Sturdy walking shoes recommended; ancient stone surfaces are uneven and polished.',
      'Respect sacred archaeological podiums and keep to defined visitor walkways.',
    ],
    levelHighlights: [
      'Roma Cella: West apse facing the Roman Forum with diamond-coffered ceiling',
      'Venus Cella: East apse overlooking the Colosseum with colossal column drums',
      'Panoramic Belvedere: Elevated terrace offering iconic photo views of the Colosseum',
    ],
    audioIntroText:
      'Before you stands the Temple of Venus and Rome, the grandest temple ever built in the ancient capital. Personally designed by Emperor Hadrian and inaugurated in 135 AD, it housed two back-to-back shrines dedicated to Venus, mother of the Roman people, and Eternal Rome herself. Step onto the elevated terrace to witness one of the most stunning panoramic vistas of the Colosseum.',
  },
  roman_forum: {
    era: '8th Century BC – 4th Century AD',
    builders: 'Roman Kings, Republic Consuls, and Emperors',
    historicalSummary:
      'The heart of ancient Rome’s religious, commercial, legal, and political life for over a millennium. Packed with historic temples, senate houses, triumphal arches, and civic basilicas flanking the sacred processional road, Via Sacra.',
    securityGuidelines: [
      'Access requires a combined Colosseum-Forum-Palatine archaeological pass.',
      'Entry through the dedicated gate turnstiles with barcode ticket scanning and bag checks.',
      'No large wheeled luggage; drinkable water fountains (nasoni) are located inside.',
    ],
    levelHighlights: [
      'Via Sacra: The sacred main street trodden by triumphal processions',
      'Curia Julia: The historic meeting place of the Roman Senate',
      'Temple of Saturn & Rostra: Ancient state treasury and public orator podium',
      'Arch of Septimius Severus: Tri-vaulted monumental triumphal arch from 203 AD',
    ],
    audioIntroText:
      'You are approaching the Roman Forum, the beating heart of ancient Roman politics, commerce, and religion for over a thousand years. Through this gate, the Via Sacra leads past the Senate House, sacred temples, and triumphal monuments. Please have your admission pass scanned at the turnstile and stay on designated stone paths.',
  },
};

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/colosseum';
  console.log(`Connecting to ${mongoUri}...`);
  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB_NAME || 'colosseum',
  });

  for (const [code, onboarding] of Object.entries(ONBOARDING_DEFAULTS)) {
    const updated = await Landmark.findOneAndUpdate(
      { code },
      {
        $set: {
          era: onboarding.era,
          builders: onboarding.builders,
          historicalSummary: onboarding.historicalSummary,
          securityGuidelines: onboarding.securityGuidelines,
          levelHighlights: onboarding.levelHighlights,
          audioIntroText: onboarding.audioIntroText,
        },
      },
      { new: true }
    );
    if (updated) {
      console.log(`✅ Updated landmark ${code} with onboarding details.`);
    } else {
      console.log(`⚠️ Landmark ${code} not found in database.`);
    }
  }

  await bumpTourManifest();
  await clearCachePattern('landmarks:*');
  await clearCachePattern('tours:*');
  await clearCachePattern('sync:*');
  console.log('✅ Caches invalidated and manifest bumped.');

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(console.error);
