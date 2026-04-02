import * as THREE from 'three';

const TIME_PRESETS = [
  { hour: 0,  ambient: 0.08, sunAngle: -15, sunColor: 0x1A237E, sky: '#0D1B2A', label: 'night' },
  { hour: 5,  ambient: 0.25, sunAngle: 5,   sunColor: 0xFFCC80, sky: '#FFE0B2', label: 'dawn' },
  { hour: 8,  ambient: 0.50, sunAngle: 35,  sunColor: 0xFFF3E0, sky: '#87CEEB', label: 'morning' },
  { hour: 12, ambient: 0.60, sunAngle: 70,  sunColor: 0xFFFFFF, sky: '#87CEEB', label: 'midday' },
  { hour: 15, ambient: 0.50, sunAngle: 50,  sunColor: 0xFFF8E1, sky: '#87CEEB', label: 'afternoon' },
  { hour: 18, ambient: 0.40, sunAngle: 15,  sunColor: 0xFFAB40, sky: '#FF8F00', label: 'golden' },
  { hour: 20, ambient: 0.20, sunAngle: 5,   sunColor: 0xFF7043, sky: '#BF360C', label: 'dusk' },
  { hour: 22, ambient: 0.08, sunAngle: -15, sunColor: 0x1A237E, sky: '#0D1B2A', label: 'night' },
  { hour: 24, ambient: 0.08, sunAngle: -15, sunColor: 0x1A237E, sky: '#0D1B2A', label: 'night' },
];

export function getTimeLighting(date) {
  if (!date) date = new Date();
  const hour = date.getHours() + date.getMinutes() / 60;

  // Find the two presets we're between
  let lower = TIME_PRESETS[0];
  let upper = TIME_PRESETS[1];
  for (let i = 0; i < TIME_PRESETS.length - 1; i++) {
    if (hour >= TIME_PRESETS[i].hour && hour < TIME_PRESETS[i + 1].hour) {
      lower = TIME_PRESETS[i];
      upper = TIME_PRESETS[i + 1];
      break;
    }
  }

  // Lerp factor between the two presets
  const span = upper.hour - lower.hour || 1;
  const t = (hour - lower.hour) / span;

  // Interpolate values
  const ambient = lower.ambient + (upper.ambient - lower.ambient) * t;
  const sunAngle = lower.sunAngle + (upper.sunAngle - lower.sunAngle) * t;

  // Interpolate colors
  const sunColor = new THREE.Color(lower.sunColor).lerp(new THREE.Color(upper.sunColor), t);
  const skyColor = new THREE.Color(lower.sky).lerp(new THREE.Color(upper.sky), t);

  // Calculate sun position from angle
  const angleRad = (sunAngle * Math.PI) / 180;
  const sunRadius = 30;
  const sunPosition = new THREE.Vector3(
    Math.cos(angleRad) * sunRadius * 0.3,
    Math.sin(angleRad) * sunRadius,
    sunRadius * 0.3,
  );

  return {
    ambient,
    sunPosition,
    sunColor,
    skyColor,
    label: t < 0.5 ? lower.label : upper.label,
  };
}
