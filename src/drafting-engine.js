/* Patroner drafting engine — deterministic, testable logic shared by the UI. */
(function (root) {
  'use strict';

  const SIZE_CHART = Object.freeze({
    XS: Object.freeze({ waist: 60, hip: 84, depth: 18, length: 60 }),
    S: Object.freeze({ waist: 66, hip: 90, depth: 19, length: 60 }),
    M: Object.freeze({ waist: 72, hip: 96, depth: 20, length: 60 }),
    L: Object.freeze({ waist: 80, hip: 104, depth: 21, length: 60 }),
    XL: Object.freeze({ waist: 88, hip: 112, depth: 22, length: 60 }),
    XXL: Object.freeze({ waist: 96, hip: 120, depth: 23, length: 60 })
  });
  const SIZE_ORDER = Object.freeze(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  const BASE_SIZE = 'M';

  // Versioned, explicit schemas. These are Patroner's provisional skirt
  // measurements, not a claim that the chart represents a universal standard.
  const MEASUREMENT_SCHEMA_VERSION = '1.0.0';
  const MEASUREMENT_SCHEMAS = Object.freeze({
    'skirt.body.v1': Object.freeze({
      id: 'skirt.body.v1', version: MEASUREMENT_SCHEMA_VERSION, garment: 'skirt', units: 'cm',
      fields: Object.freeze([
        Object.freeze({ key: 'waist_cm', label: 'Body waist circumference', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'hip_cm', label: 'Body hip circumference', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'hip_depth_cm', label: 'Waist-to-hip vertical depth', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'length_cm', label: 'Finished skirt length', unit: 'cm', type: 'positive', required: true })
      ])
    }),
    'trouser.body.v1': Object.freeze({
      id: 'trouser.body.v1', version: MEASUREMENT_SCHEMA_VERSION, garment: 'trouser', units: 'cm',
      fields: Object.freeze([
        Object.freeze({ key: 'waist_cm', label: 'Body waist circumference', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'hip_cm', label: 'Body hip circumference', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'crotch_depth_cm', label: 'Seated crotch depth', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'inseam_cm', label: 'Inside leg length', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'outseam_cm', label: 'Outside leg length', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'leg_opening_cm', label: 'Leg opening circumference', unit: 'cm', type: 'positive', required: true })
      ])
    }),
    'bodice.body.v1': Object.freeze({
      id: 'bodice.body.v1', version: MEASUREMENT_SCHEMA_VERSION, garment: 'bodice', units: 'cm',
      fields: Object.freeze([
        Object.freeze({ key: 'bust_cm', label: 'Bust circumference', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'waist_cm', label: 'Body waist circumference', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'shoulder_cm', label: 'Shoulder length', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'back_length_cm', label: 'Back waist length', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'armhole_depth_cm', label: 'Armhole depth', unit: 'cm', type: 'positive', required: true }),
        Object.freeze({ key: 'neck_width_cm', label: 'Neck width', unit: 'cm', type: 'positive', required: true })
      ])
    })
  });
  const LANDMARK_SCHEMA_VERSION = '1.0.0';
  const SKIRT_LANDMARK_SCHEMA = Object.freeze({
    id: 'skirt.panel.landmarks.v1', version: LANDMARK_SCHEMA_VERSION, units: 'mm',
    points: Object.freeze([
      Object.freeze({ id: 'CF_FOLD_WAIST', index: 0, role: 'anchor', xAxis: 'fixed', yAxis: 'fixed' }),
      Object.freeze({ id: 'SIDE_WAIST', index: 1, role: 'waist', xAxis: 'waist', yAxis: 'fixed' }),
      Object.freeze({ id: 'SIDE_HIP', index: 13, role: 'hip-depth endpoint', xAxis: 'hip', yAxis: 'hip_depth' }),
      Object.freeze({ id: 'SIDE_HEM', index: 14, role: 'hem', xAxis: 'hip', yAxis: 'length' }),
      Object.freeze({ id: 'CF_FOLD_HEM', index: 15, role: 'fold hem', xAxis: 'fixed', yAxis: 'length' })
    ])
  });
  const GRADING_RULESET_VERSION = '1.0.0-provisional';
  const PROVISIONAL_SKIRT_GRADE_RULESET = Object.freeze({
    id: 'patroner.skirt.landmark-linear.v1', version: GRADING_RULESET_VERSION,
    status: 'provisional-not-professionally-validated', baseSize: BASE_SIZE, units: 'mm-per-cm-delta',
    // Coefficients are transparent engineering placeholders. They must be
    // reviewed against a trusted reference block before production use.
    rules: Object.freeze({
      CF_FOLD_WAIST: Object.freeze({ waist: 0, hip: 0, hip_depth: 0, length: 0 }),
      SIDE_WAIST: Object.freeze({ waist: 2.5, hip: 0, hip_depth: 0, length: 0 }),
      SIDE_HIP: Object.freeze({ waist: 0, hip: 2.5, hip_depth: 10, length: 0 }),
      SIDE_HEM: Object.freeze({ waist: 0, hip: 2.5, hip_depth: 0, length: 10 }),
      CF_FOLD_HEM: Object.freeze({ waist: 0, hip: 0, hip_depth: 0, length: 10 })
    })
  });

  function validateMeasurementSet(measurements, schemaId = 'skirt.body.v1') {
    const schema = MEASUREMENT_SCHEMAS[schemaId];
    if (!schema) throw new RangeError(`Unknown measurement schema: ${schemaId}`);
    const errors = [], warnings = [];
    if (!measurements || typeof measurements !== 'object' || Array.isArray(measurements)) {
      return { valid: false, schemaId, schemaVersion: schema.version, errors: ['Measurements must be an object.'], warnings };
    }
    for (const field of schema.fields) {
      const value = measurements[field.key];
      if (field.required && !Number.isFinite(value)) errors.push(`${field.key} is required and must be finite.`);
      else if (Number.isFinite(value) && field.type === 'positive' && value <= 0) errors.push(`${field.key} must be greater than zero.`);
    }
    if (Number.isFinite(measurements.hip_cm) && Number.isFinite(measurements.waist_cm) && measurements.hip_cm < measurements.waist_cm) {
      warnings.push('Hip circumference is smaller than waist circumference; verify the measurements and intended garment block.');
    }
    if (Number.isFinite(measurements.hip_depth_cm) && Number.isFinite(measurements.length_cm) && measurements.hip_depth_cm >= measurements.length_cm) {
      warnings.push('Hip depth is equal to or greater than garment length; verify the measurements.');
    }
    if (schemaId === 'trouser.body.v1' && Number.isFinite(measurements.inseam_cm) && Number.isFinite(measurements.outseam_cm) && measurements.inseam_cm > measurements.outseam_cm) warnings.push('Inseam exceeds outseam; verify how the lengths were measured.');
    if (schemaId === 'bodice.body.v1' && Number.isFinite(measurements.bust_cm) && Number.isFinite(measurements.waist_cm) && measurements.waist_cm > measurements.bust_cm) warnings.push('Waist exceeds bust; verify the measurements and intended block.');
    return { valid: errors.length === 0, schemaId, schemaVersion: schema.version, errors, warnings };
  }

  function getGradingProfile(size, options = {}) {
    if (!Object.prototype.hasOwnProperty.call(SIZE_CHART, size)) throw new RangeError(`Unsupported standard size: ${size}`);
    const baseSize = options.baseSize || BASE_SIZE;
    if (!Object.prototype.hasOwnProperty.call(SIZE_CHART, baseSize)) throw new RangeError(`Unsupported base size: ${baseSize}`);
    const base = SIZE_CHART[baseSize], target = SIZE_CHART[size];
    const deltaCm = {
      waist: target.waist - base.waist, hip: target.hip - base.hip,
      hip_depth: target.depth - base.depth, length: target.length - base.length
    };
    return {
      size, baseSize, chartId: 'patroner-provisional-skirt-chart', chartVersion: 'provisional-1',
      measurementSchemaId: 'skirt.body.v1', measurementSchemaVersion: MEASUREMENT_SCHEMA_VERSION,
      landmarkSchemaId: SKIRT_LANDMARK_SCHEMA.id, landmarkSchemaVersion: LANDMARK_SCHEMA_VERSION,
      gradingRuleSetId: PROVISIONAL_SKIRT_GRADE_RULESET.id,
      gradingRuleSetVersion: PROVISIONAL_SKIRT_GRADE_RULESET.version,
      gradingStatus: PROVISIONAL_SKIRT_GRADE_RULESET.status, deltaCm
    };
  }

  function validateGradeRuleSet(ruleSet, landmarkSchema = SKIRT_LANDMARK_SCHEMA) {
    const errors = [], warnings = [];
    if (!ruleSet || typeof ruleSet !== 'object') return { valid: false, errors: ['Grade rule set must be an object.'], warnings };
    if (typeof ruleSet.id !== 'string' || !ruleSet.id.trim()) errors.push('Grade rule set requires a non-empty id.');
    if (typeof ruleSet.version !== 'string' || !ruleSet.version.trim()) errors.push('Grade rule set requires a version.');
    if (!ruleSet.rules || typeof ruleSet.rules !== 'object') errors.push('Grade rule set requires a rules object.');
    const ids = landmarkSchema.points.map(p => p.id);
    for (const id of ids) {
      const rule = ruleSet.rules && ruleSet.rules[id];
      if (!rule) { errors.push(`Missing grading rule for landmark ${id}.`); continue; }
      for (const axis of ['waist', 'hip', 'hip_depth', 'length']) {
        if (!Number.isFinite(rule[axis])) errors.push(`Rule ${id}.${axis} must be finite.`);
      }
    }
    if (ruleSet.status && ruleSet.status !== 'validated') warnings.push(`Rule set status is ${ruleSet.status}; professional reference-block and toile validation are still required.`);
    return { valid: errors.length === 0, errors, warnings };
  }

  function applyLandmarkGradeRules(baseLandmarks, deltaCm, ruleSet = PROVISIONAL_SKIRT_GRADE_RULESET, landmarkSchema = SKIRT_LANDMARK_SCHEMA) {
    const validation = validateGradeRuleSet(ruleSet, landmarkSchema);
    if (!validation.valid) throw new RangeError(`Invalid grade rule set: ${validation.errors.join(' ')}`);
    for (const axis of ['waist', 'hip', 'hip_depth', 'length']) {
      if (!deltaCm || !Number.isFinite(deltaCm[axis])) throw new TypeError(`Grade delta ${axis} must be finite centimetres.`);
    }
    if (!Array.isArray(baseLandmarks)) throw new TypeError('baseLandmarks must be an array.');
    const byId = new Map(baseLandmarks.map(p => [p.id, p]));
    return landmarkSchema.points.map(spec => {
      const p = byId.get(spec.id);
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new RangeError(`Missing finite base landmark ${spec.id}.`);
      const r = ruleSet.rules[spec.id];
      return { id: spec.id, x: p.x + deltaCm.waist * r.waist + deltaCm.hip * r.hip,
        y: p.y + deltaCm.hip_depth * r.hip_depth + deltaCm.length * r.length };
    });
  }

  function getGradingRows() {
    return SIZE_ORDER.map((size, i) => {
      const p = SIZE_CHART[size];
      const prev = i ? SIZE_CHART[SIZE_ORDER[i - 1]] : null;
      return {
        size, waist: p.waist, hip: p.hip, hip_depth: p.depth, length: p.length,
        waist_grade: prev ? p.waist - prev.waist : 0,
        hip_grade: prev ? p.hip - prev.hip : 0,
        hip_depth_grade: prev ? p.depth - prev.depth : 0,
        length_grade: prev ? p.length - prev.length : 0
      };
    });
  }

  function buildGradedMeasurements(size) {
    if (!Object.prototype.hasOwnProperty.call(SIZE_CHART, size)) {
      throw new RangeError(`Unsupported standard size: ${size}`);
    }
    const base = SIZE_CHART[BASE_SIZE];
    const target = SIZE_CHART[size];
    return {
      size_profile: size,
      waist_cm: target.waist,
      hip_cm: target.hip,
      hip_depth_cm: target.depth,
      length_cm: target.length,
      delta: {
        waist_cm: target.waist - base.waist,
        hip_cm: target.hip - base.hip,
        hip_depth_cm: target.depth - base.depth,
        length_cm: target.length - base.length
      }
    };
  }

  function validateMeasurements(m) {
    const errors = [];
    const warnings = [];
    for (const key of ['waist_cm', 'hip_cm', 'hip_depth_cm', 'length_cm']) {
      if (!Number.isFinite(m[key]) || m[key] <= 0) errors.push(`${key} must be greater than zero.`);
    }
    for (const key of ['waist_ease_cm', 'hip_ease_cm', 'seam_allowance_cm', 'hem_allowance_cm', 'dart_cm']) {
      if (!Number.isFinite(m[key]) || m[key] < 0) errors.push(`${key} cannot be negative.`);
    }
    if (m.hip_cm < m.waist_cm) warnings.push('Hip measurement is smaller than waist; verify your measurements.');
    if (m.hip_depth_cm >= m.length_cm) warnings.push('Hip depth is equal to or greater than skirt length; verify these values.');
    if (m.dart_cm > m.waist_cm / 4) warnings.push('Dart intake is unusually large for this simplified sample.');
    return { errors, warnings };
  }

  /*
   * Point grading for the current 16-point skirt outline.
   * Coordinates are in mm. The outline index contract is explicit:
   * 0 fold waist, 1 side waist, 2..13 sampled side seam, 14 side hem,
   * 15 fold hem. Circumference deltas are quarter-panel allocations
   * (cm * 2.5 mm); vertical deltas use cm * 10 mm.
   * This is a transparent experimental rule set, not industrial grading.
   */
  function applyPointGrading(baseOutline, baseMeasurements, targetMeasurements) {
    if (!Array.isArray(baseOutline) || baseOutline.length !== 16) {
      throw new RangeError('Point grading requires the current 16-point outline schema.');
    }
    const keys = ['waist_cm', 'hip_cm', 'hip_depth_cm', 'length_cm'];
    for (const key of keys) {
      if (!Number.isFinite(baseMeasurements[key]) || !Number.isFinite(targetMeasurements[key])) {
        throw new TypeError(`Point grading requires finite ${key} values.`);
      }
    }
    const dWaist = (targetMeasurements.waist_cm - baseMeasurements.waist_cm) * 2.5;
    const dHip = (targetMeasurements.hip_cm - baseMeasurements.hip_cm) * 2.5;
    const dDepth = (targetMeasurements.hip_depth_cm - baseMeasurements.hip_depth_cm) * 10;
    const dLength = (targetMeasurements.length_cm - baseMeasurements.length_cm) * 10;

    return baseOutline.map((point, index) => {
      const [x, y] = point;
      if (index === 0) return [x, y]; // center fold at waist remains anchored
      if (index === 1) return [x + dWaist, y];
      if (index >= 2 && index <= 13) {
        const t = (index - 1) / 12;
        return [x + dWaist * (1 - t) + dHip * t, y + dDepth * t];
      }
      if (index === 14) return [x + dHip, y + dLength];
      return [x, y + dLength]; // center-fold hem
    });
  }


  const GEOMETRY_TOLERANCE_MM = 0.02;
  function assertPoints(points, minimum = 2) {
    if (!Array.isArray(points) || points.length < minimum || !points.every(p => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))) {
      throw new TypeError(`Expected at least ${minimum} finite [x, y] points.`);
    }
  }
  function distance(a, b) { return Math.hypot(b[0] - a[0], b[1] - a[1]); }
  function signedArea(points) {
    assertPoints(points, 3);
    let sum = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      sum += a[0] * b[1] - b[0] * a[1];
    }
    return sum / 2;
  }
  function polylineLength(points, closed = false) {
    assertPoints(points, 2);
    let length = 0;
    for (let i = 1; i < points.length; i++) length += distance(points[i - 1], points[i]);
    if (closed && points.length > 2) length += distance(points[points.length - 1], points[0]);
    return length;
  }
  function orientation(a, b, c, eps = GEOMETRY_TOLERANCE_MM) {
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const scale = Math.max(1, distance(a, b), distance(a, c), distance(b, c));
    if (Math.abs(cross) <= eps * scale) return 0;
    return cross > 0 ? 1 : -1;
  }
  function onSegment(a, b, p, eps = GEOMETRY_TOLERANCE_MM) {
    return p[0] >= Math.min(a[0], b[0]) - eps && p[0] <= Math.max(a[0], b[0]) + eps &&
      p[1] >= Math.min(a[1], b[1]) - eps && p[1] <= Math.max(a[1], b[1]) + eps;
  }
  function segmentsIntersect(a, b, c, d, eps = GEOMETRY_TOLERANCE_MM) {
    const o1 = orientation(a, b, c, eps), o2 = orientation(a, b, d, eps);
    const o3 = orientation(c, d, a, eps), o4 = orientation(c, d, b, eps);
    if (o1 * o2 < 0 && o3 * o4 < 0) return true;
    return (o1 === 0 && onSegment(a, b, c, eps)) || (o2 === 0 && onSegment(a, b, d, eps)) ||
      (o3 === 0 && onSegment(c, d, a, eps)) || (o4 === 0 && onSegment(c, d, b, eps));
  }
  function polygonSelfIntersections(points, eps = GEOMETRY_TOLERANCE_MM) {
    assertPoints(points, 3);
    const hits = [];
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const a = points[i], b = points[(i + 1) % n];
      for (let j = i + 1; j < n; j++) {
        if (j === i || j === (i + 1) % n || (j + 1) % n === i) continue;
        const c = points[j], d = points[(j + 1) % n];
        if (segmentsIntersect(a, b, c, d, eps)) hits.push({ edgeA: i, edgeB: j });
      }
    }
    return hits;
  }
  function analyzePolygon(points, options = {}) {
    const eps = Number.isFinite(options.toleranceMm) ? Math.max(0, options.toleranceMm) : GEOMETRY_TOLERANCE_MM;
    const errors = [], warnings = [];
    try { assertPoints(points, 3); } catch (e) { return { valid: false, errors: [e.message], warnings, areaMm2: 0, perimeterMm: 0, bounds: null, edgeLengthsMm: [], selfIntersections: [] }; }
    const edgeLengths = points.map((p, i) => distance(p, points[(i + 1) % points.length]));
    const zeroEdges = edgeLengths.map((len, i) => len <= eps ? i : -1).filter(i => i >= 0);
    if (zeroEdges.length) errors.push(`Zero/near-zero edges at indices: ${zeroEdges.join(', ')}.`);
    const area = signedArea(points);
    if (Math.abs(area) <= eps * eps) errors.push('Polygon area is zero or below tolerance.');
    const intersections = polygonSelfIntersections(points, eps);
    if (intersections.length) errors.push(`Polygon has ${intersections.length} non-adjacent edge intersection(s).`);
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const bounds = { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
    bounds.widthMm = bounds.maxX - bounds.minX; bounds.heightMm = bounds.maxY - bounds.minY;
    if (bounds.widthMm <= eps || bounds.heightMm <= eps) errors.push('Polygon width or height is below tolerance.');
    if (points.length > 256) warnings.push('Polygon has more than 256 vertices; review performance and intended precision.');
    return { valid: errors.length === 0, errors, warnings, areaMm2: area, absoluteAreaMm2: Math.abs(area), perimeterMm: edgeLengths.reduce((a, b) => a + b, 0), bounds, edgeLengthsMm: edgeLengths, zeroLengthEdgeIndices: zeroEdges, selfIntersections: intersections, orientation: area > 0 ? 'positive' : area < 0 ? 'negative' : 'degenerate' };
  }
  function compareSeamLengths(seamA, seamB, options = {}) {
    assertPoints(seamA, 2); assertPoints(seamB, 2);
    const lengthA = polylineLength(seamA), lengthB = polylineLength(seamB);
    const deltaMm = Math.abs(lengthA - lengthB);
    const toleranceMm = Number.isFinite(options.toleranceMm) ? Math.max(0, options.toleranceMm) : 2;
    return { compatible: deltaMm <= toleranceMm, lengthAmm: lengthA, lengthBmm: lengthB, deltaMm, toleranceMm, deltaPercent: Math.max(lengthA, lengthB) ? deltaMm / Math.max(lengthA, lengthB) * 100 : 0 };
  }
  function offsetPolygon(points, distanceMm, options = {}) {
    assertPoints(points, 3);
    if (!Number.isFinite(distanceMm)) throw new TypeError('Offset distance must be finite.');
    const miterLimit = Number.isFinite(options.miterLimit) && options.miterLimit > 0 ? options.miterLimit : 8;
    const area = signedArea(points);
    if (Math.abs(area) <= GEOMETRY_TOLERANCE_MM ** 2) throw new RangeError('Cannot offset a degenerate polygon.');
    const sign = area > 0 ? 1 : -1;
    const lines = points.map((a, i) => {
      const b = points[(i + 1) % points.length], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      if (len <= GEOMETRY_TOLERANCE_MM) throw new RangeError(`Cannot offset zero-length edge ${i}.`);
      return { a: [a[0] + sign * dy / len * distanceMm, a[1] - sign * dx / len * distanceMm], v: [dx, dy] };
    });
    const out = points.map((point, i) => {
      const prev = lines[(i + lines.length - 1) % lines.length], next = lines[i];
      const cross = prev.v[0] * next.v[1] - prev.v[1] * next.v[0];
      if (Math.abs(cross) <= 1e-8) return [point[0] + sign * (prev.v[1] / (Math.hypot(...prev.v) || 1)) * distanceMm, point[1] - sign * (prev.v[0] / (Math.hypot(...prev.v) || 1)) * distanceMm];
      const qx = next.a[0] - prev.a[0], qy = next.a[1] - prev.a[1];
      const t = (qx * next.v[1] - qy * next.v[0]) / cross;
      const result = [prev.a[0] + t * prev.v[0], prev.a[1] + t * prev.v[1]];
      if (distance(result, point) > Math.max(1, Math.abs(distanceMm) * miterLimit)) throw new RangeError(`Offset miter exceeds safety limit at vertex ${i}.`);
      return result;
    });
    const analysis = analyzePolygon(out);
    if (!analysis.valid) throw new RangeError(`Offset produced invalid polygon: ${analysis.errors.join(' ')}`);
    return out;
  }

  /* Canonical construction primitives. Coordinates are millimetres. */
  function buildSkirtPanel(options = {}) {
    const waistWidthMm = options.waistWidthMm;
    const hipWidthMm = options.hipWidthMm;
    const hipDepthMm = options.hipDepthMm;
    const lengthMm = options.lengthMm;
    const dartIntakeMm = options.dartIntakeMm ?? 0;
    const samples = options.curveSamples ?? 12;
    const controlDepthRatio = options.controlDepthRatio ?? 0.34;
    const controlWidthRatio = options.controlWidthRatio ?? 0.82;
    for (const [name, value] of Object.entries({ waistWidthMm, hipWidthMm, hipDepthMm, lengthMm, dartIntakeMm })) {
      if (!Number.isFinite(value) || value < 0) throw new TypeError(`${name} must be a finite non-negative number.`);
    }
    if (waistWidthMm <= 0 || hipWidthMm <= 0 || hipDepthMm <= 0 || lengthMm <= 0) {
      throw new RangeError('Skirt panel widths, hip depth, and length must be greater than zero.');
    }
    if (!Number.isInteger(samples) || samples < 2 || samples > 128) throw new RangeError('curveSamples must be an integer from 2 to 128.');
    if (dartIntakeMm > waistWidthMm) throw new RangeError('Dart intake cannot exceed the closed target waist width.');
    if (!(controlWidthRatio >= 0 && controlWidthRatio <= 1) || !(controlDepthRatio >= 0 && controlDepthRatio <= 1)) {
      throw new RangeError('Bezier control ratios must be between 0 and 1.');
    }
    const waistTopMm = waistWidthMm + dartIntakeMm;
    const control = [waistTopMm + (hipWidthMm - waistTopMm) * controlWidthRatio, hipDepthMm * controlDepthRatio];
    const side = [];
    for (let i = 1; i <= samples; i++) {
      const t = i / samples, u = 1 - t;
      side.push([
        u*u*waistTopMm + 2*u*t*control[0] + t*t*hipWidthMm,
        2*u*t*control[1] + t*t*hipDepthMm
      ]);
    }
    const outline = [[0, 0], [waistTopMm, 0], ...side, [hipWidthMm, lengthMm], [0, lengthMm]];
    return { outline, sideSeam: [[waistTopMm, 0], ...side, [hipWidthMm, lengthMm]], waistTopMm, curveSamples: samples };
  }

  // Curve-aware grading regenerates the complete skirt panel from target
  // measurements. It intentionally does not translate a fixed set of sampled
  // vertices, so curve samples remain consistent with the target control geometry.
  function buildGradedSkirtPanel(baseMeasurements, targetMeasurements, options = {}) {
    const required = ['waist_cm', 'hip_cm', 'hip_depth_cm', 'length_cm'];
    for (const key of required) {
      if (!Number.isFinite(baseMeasurements && baseMeasurements[key]) || !Number.isFinite(targetMeasurements && targetMeasurements[key])) {
        throw new TypeError(`Curve-aware skirt grading requires finite ${key} values in base and target measurements.`);
      }
    }
    const waistEaseCm = options.waistEaseCm ?? 0;
    const hipEaseCm = options.hipEaseCm ?? 0;
    const dartIntakeCm = options.dartIntakeCm ?? 0;
    for (const [key, value] of Object.entries({ waistEaseCm, hipEaseCm, dartIntakeCm })) {
      if (!Number.isFinite(value) || value < 0) throw new RangeError(`${key} must be finite and non-negative.`);
    }
    const panel = buildSkirtPanel({
      waistWidthMm: (targetMeasurements.waist_cm + waistEaseCm) * 2.5,
      hipWidthMm: (targetMeasurements.hip_cm + hipEaseCm) * 2.5,
      hipDepthMm: targetMeasurements.hip_depth_cm * 10,
      lengthMm: targetMeasurements.length_cm * 10,
      dartIntakeMm: dartIntakeCm * 10,
      curveSamples: options.curveSamples ?? 12,
      controlWidthRatio: options.controlWidthRatio ?? 0.82,
      controlDepthRatio: options.controlDepthRatio ?? 0.34
    });
    return { ...panel, grading: {
      method: 'curve-regeneration-v1', baseMeasurements: { ...baseMeasurements }, targetMeasurements: { ...targetMeasurements },
      deltaCm: Object.fromEntries(required.map(key => [key, targetMeasurements[key] - baseMeasurements[key]])),
      status: 'provisional-not-professionally-validated'
    } };
  }

  // Foundational trouser leg panel. This is a parametric construction scaffold,
  // not a fitted production trouser block; the crotch curve remains provisional.
  function buildTrouserPanel(options = {}) {
    const { hipWidthMm, crotchExtensionMm, crotchDepthMm, inseamMm, outseamMm, kneeWidthMm, hemWidthMm } = options;
    const values = { hipWidthMm, crotchExtensionMm, crotchDepthMm, inseamMm, outseamMm, kneeWidthMm, hemWidthMm };
    for (const [key, value] of Object.entries(values)) if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${key} must be greater than zero.`);
    if (inseamMm >= outseamMm) throw new RangeError('inseamMm must be less than outseamMm for this provisional panel.');
    const waistX = hipWidthMm * 0.72;
    const kneeY = outseamMm * 0.58;
    const crotch = [hipWidthMm + crotchExtensionMm, crotchDepthMm];
    const legCenter = hipWidthMm * 0.56;
    const outline = [[0,0],[waistX,0],[hipWidthMm,crotchDepthMm*0.35],crotch,[legCenter+kneeWidthMm/2,kneeY],[legCenter+hemWidthMm/2,outseamMm],[legCenter-hemWidthMm/2,outseamMm],[legCenter-kneeWidthMm/2,kneeY],[hipWidthMm*0.38,crotchDepthMm],[0,crotchDepthMm*0.35]];
    const analysis = analyzePolygon(outline);
    return { garment: 'trouser', blockVersion: 'trouser.panel.experimental.v1', outline, analysis, status: 'experimental-scaffold' };
  }

  // Foundational half-bodice panel using bust/waist widths and shoulder/armhole
  // landmarks. Dart shaping and front/back balance are intentionally not inferred.
  function buildBodicePanel(options = {}) {
    const { bustWidthMm, waistWidthMm, shoulderMm, backLengthMm, armholeDepthMm, neckWidthMm } = options;
    const values = { bustWidthMm, waistWidthMm, shoulderMm, backLengthMm, armholeDepthMm, neckWidthMm };
    for (const [key, value] of Object.entries(values)) if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${key} must be greater than zero.`);
    if (armholeDepthMm >= backLengthMm) throw new RangeError('armholeDepthMm must be less than backLengthMm.');
    if (neckWidthMm >= bustWidthMm) throw new RangeError('neckWidthMm must be less than bustWidthMm.');
    const shoulderEndX = neckWidthMm + shoulderMm;
    const outline = [[0,0],[neckWidthMm,0],[shoulderEndX,Math.min(shoulderMm*0.22, 18)],[bustWidthMm,armholeDepthMm],[bustWidthMm*0.94,backLengthMm*0.72],[waistWidthMm,backLengthMm],[0,backLengthMm]];
    const analysis = analyzePolygon(outline);
    return { garment: 'bodice', blockVersion: 'bodice.panel.experimental.v1', outline, analysis, status: 'experimental-scaffold' };
  }

  function buildDart(options = {}) {
    const { centerXmm, intakeMm, depthMm, waistYmm = 0 } = options;
    for (const [name, value] of Object.entries({ centerXmm, intakeMm, depthMm, waistYmm })) {
      if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite.`);
    }
    if (intakeMm < 0 || depthMm < 0) throw new RangeError('Dart intake and depth cannot be negative.');
    if (intakeMm === 0 || depthMm === 0) return { active: false, legs: [], apex: null, intakeMm: 0, depthMm: 0 };
    const left = [centerXmm - intakeMm / 2, waistYmm];
    const right = [centerXmm + intakeMm / 2, waistYmm];
    const apex = [centerXmm, waistYmm + depthMm];
    return { active: true, legs: [left, apex, right], left, apex, right, intakeMm, depthMm, legLengthMm: distance(left, apex) };
  }

  function buildNotch(options = {}) {
    const { point, tangent, depthMm = 4, widthMm = 4 } = options;
    assertPoints([point, tangent], 2);
    if (!Number.isFinite(depthMm) || depthMm <= 0 || !Number.isFinite(widthMm) || widthMm <= 0) {
      throw new RangeError('Notch depth and width must be greater than zero.');
    }
    const tx = tangent[0] - point[0], ty = tangent[1] - point[1], len = Math.hypot(tx, ty);
    if (len <= GEOMETRY_TOLERANCE_MM) throw new RangeError('Notch tangent must have non-zero length.');
    // The notch is a V mark: its mouth is centred on the seam and its tip lies
    // depthMm along the seam normal. Orientation is explicit and reproducible.
    const ux = tx / len, uy = ty / len, nx = -uy, ny = ux;
    const left = [point[0] - ux * widthMm / 2, point[1] - uy * widthMm / 2];
    const right = [point[0] + ux * widthMm / 2, point[1] + uy * widthMm / 2];
    const tip = [point[0] + nx * depthMm, point[1] + ny * depthMm];
    return { points: [left, tip, right], point: point.slice(), depthMm, widthMm };
  }

  function validateSeamAllowance(stitchLine, cutLine, options = {}) {
    const toleranceMm = Number.isFinite(options.toleranceMm) ? Math.max(0, options.toleranceMm) : 0.5;
    const stitch = analyzePolygon(stitchLine);
    const cut = analyzePolygon(cutLine);
    const boundsDelta = stitch.valid && cut.valid ? {
      widthMm: cut.bounds.widthMm - stitch.bounds.widthMm,
      heightMm: cut.bounds.heightMm - stitch.bounds.heightMm
    } : null;
    const errors = [];
    if (!stitch.valid) errors.push(`Stitch line invalid: ${stitch.errors.join(' ')}`);
    if (!cut.valid) errors.push(`Cut line invalid: ${cut.errors.join(' ')}`);
    if (boundsDelta && (boundsDelta.widthMm < -toleranceMm || boundsDelta.heightMm < -toleranceMm)) {
      errors.push('Cut outline is smaller than the stitch outline beyond tolerance.');
    }
    return { valid: errors.length === 0, errors, toleranceMm, stitch, cut, boundsDelta,
      note: 'Bounds and topology checks do not prove a uniform seam allowance at every curve or corner.' };
  }



  // v1.27 manufacturing contracts: deterministic diagnostics, not CAD certification.
  const FABRIC_DIRECTIONS = Object.freeze(['lengthwise', 'crosswise', 'bias', 'nap', 'directional-print', 'any']);
  function validatePatternPieceMetadata(piece) {
    const errors = [], warnings = [];
    if (!piece || typeof piece !== 'object') return { valid: false, errors: ['Pattern piece must be an object.'], warnings };
    if (typeof piece.id !== 'string' || !piece.id.trim()) errors.push('Pattern piece requires a stable non-empty id.');
    if (typeof piece.name !== 'string' || !piece.name.trim()) errors.push('Pattern piece requires a human-readable name.');
    if (typeof piece.garment !== 'string' || !piece.garment.trim()) errors.push('Pattern piece requires a garment family.');
    if (!Number.isInteger(piece.cutQuantity) || piece.cutQuantity < 1 || piece.cutQuantity > 100) errors.push('cutQuantity must be an integer from 1 to 100.');
    if (typeof piece.onFold !== 'boolean') errors.push('onFold must be explicitly true or false.');
    if (!FABRIC_DIRECTIONS.includes(piece.fabricDirection)) errors.push(`fabricDirection must be one of: ${FABRIC_DIRECTIONS.join(', ')}.`);
    if (!Number.isFinite(piece.seamAllowanceMm) || piece.seamAllowanceMm < 0) errors.push('seamAllowanceMm must be finite and non-negative.');
    const geometry = analyzePolygon(piece.outline);
    if (!geometry.valid) errors.push(`Piece outline invalid: ${geometry.errors.join(' ')}`);
    if (piece.grainline != null) {
      try { assertPoints([piece.grainline.start, piece.grainline.end], 2); if (distance(piece.grainline.start, piece.grainline.end) <= GEOMETRY_TOLERANCE_MM) errors.push('Grainline start and end must be distinct.'); }
      catch (e) { errors.push(`Grainline invalid: ${e.message}`); }
    } else if (piece.onFold !== true) errors.push('A grainline is required unless the piece is explicitly cut on fold.');
    if (piece.onFold === true && piece.grainline) warnings.push('Piece is marked on-fold and also defines a grainline; confirm this is intentional.');
    if (piece.fabricDirection === 'nap' || piece.fabricDirection === 'directional-print') warnings.push('Directional fabric requires consistent orientation across paired pieces and cutting layout.');
    return { valid: errors.length === 0, errors, warnings, pieceId: piece.id || null, geometry };
  }
  function compareSeamPair(seamA, seamB, options = {}) {
    const errors = [];
    for (const [name, seam] of [['seamA', seamA], ['seamB', seamB]]) {
      if (!seam || typeof seam !== 'object') errors.push(`${name} must be a seam descriptor.`);
      else {
        if (typeof seam.pieceId !== 'string' || !seam.pieceId.trim()) errors.push(`${name}.pieceId is required.`);
        if (typeof seam.seamId !== 'string' || !seam.seamId.trim()) errors.push(`${name}.seamId is required.`);
        try { assertPoints(seam.points, 2); } catch (e) { errors.push(`${name} geometry invalid: ${e.message}`); }
      }
    }
    const toleranceMm = Number.isFinite(options.toleranceMm) ? Math.max(0, options.toleranceMm) : 2;
    if (errors.length) return { compatible: false, errors, lengthAmm: null, lengthBmm: null, deltaMm: null, toleranceMm };
    const comparison = compareSeamLengths(seamA.points, seamB.points, { toleranceMm });
    return { ...comparison, errors: [], seamA: { pieceId: seamA.pieceId, seamId: seamA.seamId }, seamB: { pieceId: seamB.pieceId, seamId: seamB.seamId }, recommendation: comparison.compatible ? 'lengths-within-tolerance' : 'review-seam-walk-ease-and-construction' };
  }
  function validatePatternAssembly(pieces, seamPairs = [], options = {}) {
    const errors = [], warnings = [], pieceReports = [], seamReports = [];
    if (!Array.isArray(pieces) || pieces.length === 0) return { valid: false, errors: ['At least one pattern piece is required.'], warnings, pieceReports, seamReports };
    const seen = new Set();
    for (const piece of pieces) {
      const report = validatePatternPieceMetadata(piece); pieceReports.push(report);
      if (!report.valid) errors.push(...report.errors.map(e => `${piece && piece.id ? piece.id : '(unnamed piece)'}: ${e}`));
      warnings.push(...report.warnings.map(w => `${piece && piece.id ? piece.id : '(unnamed piece)'}: ${w}`));
      if (piece && typeof piece.id === 'string') { if (seen.has(piece.id)) errors.push(`Duplicate pattern piece id: ${piece.id}.`); seen.add(piece.id); }
    }
    const toleranceMm = Number.isFinite(options.seamToleranceMm) ? Math.max(0, options.seamToleranceMm) : 2;
    for (const pair of seamPairs) {
      const report = compareSeamPair(pair && pair.a, pair && pair.b, { toleranceMm });
      seamReports.push({ id: pair && pair.id || null, ...report });
      if (!report.compatible) errors.push(`Seam pair ${pair && pair.id || '(unnamed)'} is incompatible: ${report.errors.join(' ') || `length delta ${Number.isFinite(report.deltaMm) ? report.deltaMm.toFixed(2) : 'unavailable'} mm exceeds tolerance.`}`);
    }
    return { valid: errors.length === 0, errors, warnings, pieceReports, seamReports, pieceCount: pieces.length, seamPairCount: seamPairs.length, seamToleranceMm: toleranceMm };
  }
  function validatePrintCalibration(options = {}) {
    const expectedMm = Number.isFinite(options.expectedMm) && options.expectedMm > 0 ? options.expectedMm : 100;
    const measuredMm = options.measuredMm;
    const tolerancePercent = Number.isFinite(options.tolerancePercent) && options.tolerancePercent >= 0 ? options.tolerancePercent : 0.5;
    if (!Number.isFinite(measuredMm) || measuredMm <= 0) return { valid: false, errors: ['Measured calibration dimension must be a positive finite number.'], expectedMm, measuredMm: null, scalePercent: null, errorPercent: null, tolerancePercent };
    const scalePercent = measuredMm / expectedMm * 100, errorPercent = Math.abs(scalePercent - 100);
    const errors = errorPercent > tolerancePercent ? [`Print scale error ${errorPercent.toFixed(3)}% exceeds tolerance ${tolerancePercent.toFixed(3)}%.`] : [];
    return { valid: errors.length === 0, errors, expectedMm, measuredMm, scalePercent, errorPercent, tolerancePercent, instruction: 'Print at Actual Size / 100%; disable fit-to-page and remeasure the calibration shape.' };
  }
  function validateTileContinuity(edgeA, edgeB, options = {}) {
    const toleranceMm = Number.isFinite(options.toleranceMm) && options.toleranceMm >= 0 ? options.toleranceMm : 1;
    try { assertPoints([edgeA && edgeA.start, edgeA && edgeA.end, edgeB && edgeB.start, edgeB && edgeB.end], 2); }
    catch (e) { return { valid: false, errors: [`Tile edge endpoints invalid: ${e.message}`], toleranceMm, endGapMm: null }; }
    const forward = distance(edgeA.end, edgeB.start), reverse = distance(edgeA.end, edgeB.end), endGapMm = Math.min(forward, reverse);
    const errors = endGapMm > toleranceMm ? [`Tile seam endpoints differ by ${endGapMm.toFixed(3)} mm; check tile order and overlap.`] : [];
    return { valid: errors.length === 0, errors, toleranceMm, startGapMm: distance(edgeA.start, edgeB.start), endGapMm, orientation: forward <= reverse ? 'forward' : 'reversed' };
  }
  function validateSeamAllowanceDistance(stitchLine, cutLine, expectedMm, options = {}) {
    const errors = [], toleranceMm = Number.isFinite(options.toleranceMm) && options.toleranceMm >= 0 ? options.toleranceMm : 0.75;
    if (!Number.isFinite(expectedMm) || expectedMm < 0) return { valid: false, errors: ['Expected seam allowance must be finite and non-negative.'], expectedMm, toleranceMm, samples: [] };
    const stitchReport = analyzePolygon(stitchLine), cutReport = analyzePolygon(cutLine);
    if (!stitchReport.valid || !cutReport.valid) return { valid: false, errors: ['Stitch and cut outlines must both have valid polygon topology.'], expectedMm, toleranceMm, samples: [] };
    const excluded = new Set(Array.isArray(options.excludedEdges) ? options.excludedEdges : []), samples = [];
    const pointSegmentDistance = (p, a, b) => { const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy; const t=den ? Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)) : 0; return Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy)); };
    for (let i=0;i<stitchLine.length;i++) {
      if (excluded.has(i)) continue;
      const a=stitchLine[i],b=stitchLine[(i+1)%stitchLine.length],sample=[(a[0]+b[0])/2,(a[1]+b[1])/2];
      const nearest=Math.min(...cutLine.map((c,j)=>pointSegmentDistance(sample,c,cutLine[(j+1)%cutLine.length]))),delta=Math.abs(nearest-expectedMm);
      samples.push({edgeIndex:i,point:sample,distanceMm:nearest,deltaMm:delta,passed:delta<=toleranceMm});
    }
    const failed=samples.filter(s=>!s.passed);
    if (failed.length) errors.push(`${failed.length} seam allowance midpoint sample(s) differ from expected ${expectedMm} mm by more than ${toleranceMm} mm.`);
    return { valid: errors.length===0, errors, expectedMm, toleranceMm, samples, sampledEdges:samples.length, failedEdges:failed.map(s=>s.edgeIndex), note:'Midpoint sampling is a diagnostic, not a continuous proof of allowance distance around curved boundaries or sharp corners.' };
  }

  // Shared rule pipeline: a rule set can combine measurement, fabric, geometry,
  // manufacturing and image-inference gates for any garment family.
  const RULE_TYPES = Object.freeze([
    'measurement-positive', 'ease-minimum', 'fabric-stretch-ease',
    'grainline-required', 'design-confidence-minimum', 'seam-allowance-minimum',
    'geometry-valid', 'seam-length-tolerance', 'piece-metadata-valid', 'print-calibration-valid'
  ]);
  function validateRuleStack(ruleSet) {
    const errors = [], warnings = [];
    if (!ruleSet || typeof ruleSet !== 'object' || !Array.isArray(ruleSet.rules)) {
      return { valid: false, errors: ['Rule stack must contain a rules array.'], warnings };
    }
    const ids = new Set();
    for (const rule of ruleSet.rules) {
      if (!rule || typeof rule !== 'object') { errors.push('Each rule must be an object.'); continue; }
      if (typeof rule.id !== 'string' || !rule.id.trim()) errors.push('Every rule requires a non-empty id.');
      else if (ids.has(rule.id)) errors.push(`Duplicate rule id: ${rule.id}.`); else ids.add(rule.id);
      if (!RULE_TYPES.includes(rule.type)) errors.push(`Unsupported rule type: ${rule.type}.`);
      if (rule.severity && !['error', 'warning', 'info'].includes(rule.severity)) errors.push(`Rule ${rule.id || '(unnamed)'} has invalid severity.`);
      if (rule.garments && (!Array.isArray(rule.garments) || rule.garments.some(g => typeof g !== 'string'))) errors.push(`Rule ${rule.id || '(unnamed)'} garments must be an array of strings.`);
    }
    if (ruleSet.status !== 'validated') warnings.push('Rule stack is not marked as professionally validated.');
    return { valid: errors.length === 0, errors, warnings };
  }
  function evaluateRuleStack(context = {}, ruleSet) {
    const schemaCheck = validateRuleStack(ruleSet);
    if (!schemaCheck.valid) return { valid: false, errors: schemaCheck.errors, warnings: schemaCheck.warnings, results: [] };
    const results = [], errors = [], warnings = [], garment = context.garment || '*';
    const fail = (rule, message) => {
      const result = { id: rule.id, type: rule.type, severity: rule.severity || 'error', passed: false, message };
      results.push(result); (result.severity === 'error' ? errors : warnings).push(message);
    };
    const pass = (rule, message) => results.push({ id: rule.id, type: rule.type, severity: rule.severity || 'error', passed: true, message });
    for (const rule of ruleSet.rules) {
      if (rule.enabled === false || (rule.garments && !rule.garments.includes('*') && !rule.garments.includes(garment))) continue;
      const p = rule.params || {};
      switch (rule.type) {
        case 'measurement-positive': {
          const fields = Array.isArray(p.fields) ? p.fields : [];
          const bad = fields.filter(k => !Number.isFinite(context.measurements && context.measurements[k]) || context.measurements[k] <= 0);
          bad.length ? fail(rule, `${rule.id}: measurements must be positive: ${bad.join(', ')}.`) : pass(rule, `${rule.id}: required measurements are positive.`); break;
        }
        case 'ease-minimum': {
          const v = context.ease && context.ease[p.field];
          Number.isFinite(v) && Number.isFinite(p.minimum) && v >= p.minimum ? pass(rule, `${rule.id}: ease meets minimum.`) : fail(rule, `${rule.id}: ${p.field} ease must be at least ${p.minimum} cm.`); break;
        }
        case 'fabric-stretch-ease': {
          const stretch = context.fabric && context.fabric.stretchPercent;
          const ease = context.ease && context.ease[p.easeField || 'hip_cm'];
          if (!Number.isFinite(stretch) || !Number.isFinite(ease)) fail(rule, `${rule.id}: fabric stretch and relevant ease are required.`);
          else if (stretch >= (p.stretchThresholdPercent ?? 10) && ease > (p.maximumEaseForStretchCm ?? 0)) fail(rule, `${rule.id}: stretch fabric may require a negative or reduced ease strategy; review the current ease.`);
          else pass(rule, `${rule.id}: fabric stretch/ease threshold passed.`); break;
        }
        case 'grainline-required': {
          const pieces = context.patternPieces;
          if (!Array.isArray(pieces) || pieces.length === 0 || pieces.some(x => !x || !x.grainline)) fail(rule, `${rule.id}: every pattern piece must define a grainline.`);
          else pass(rule, `${rule.id}: all pattern pieces define grainlines.`); break;
        }
        case 'design-confidence-minimum': {
          const confidence = context.designSpec && context.designSpec.confidence;
          Number.isFinite(confidence) && confidence >= p.minimum ? pass(rule, `${rule.id}: design interpretation confidence meets threshold.`) : fail(rule, `${rule.id}: design interpretation confidence must be at least ${p.minimum}.`); break;
        }
        case 'seam-allowance-minimum': {
          const sa = context.seamAllowanceMm;
          Number.isFinite(sa) && Number.isFinite(p.minimumMm) && sa >= p.minimumMm ? pass(rule, `${rule.id}: seam allowance meets minimum.`) : fail(rule, `${rule.id}: seam allowance must be at least ${p.minimumMm} mm.`); break;
        }
        case 'geometry-valid': {
          context.geometry && context.geometry.valid === true ? pass(rule, `${rule.id}: geometry is valid.`) : fail(rule, `${rule.id}: geometry has not passed validation.`); break;
        }
        case 'seam-length-tolerance': {
          const delta = context.seamLengthDeltaMm;
          Number.isFinite(delta) && Number.isFinite(p.toleranceMm) && Math.abs(delta) <= p.toleranceMm ? pass(rule, `${rule.id}: seam length mismatch is within tolerance.`) : fail(rule, `${rule.id}: seam length mismatch exceeds ${p.toleranceMm} mm or is unavailable.`); break;
        }
        case 'piece-metadata-valid': {
          const pieces = context.patternPieces;
          if (!Array.isArray(pieces) || pieces.length === 0) fail(rule, `${rule.id}: pattern piece metadata is unavailable.`);
          else { const reports = pieces.map(validatePatternPieceMetadata); const bad = reports.filter(r => !r.valid); bad.length ? fail(rule, `${rule.id}: ${bad.length} pattern piece(s) failed metadata validation.`) : pass(rule, `${rule.id}: all pattern pieces meet metadata contracts.`); } break;
        }
        case 'print-calibration-valid': {
          const calibration = context.printCalibration;
          calibration && calibration.valid === true ? pass(rule, `${rule.id}: print calibration is within tolerance.`) : fail(rule, `${rule.id}: print calibration has not passed verification.`); break;
        }
      }
    }
    return { valid: errors.length === 0, errors, warnings, results, ruleSetId: ruleSet.id || null, ruleSetVersion: ruleSet.version || null, garment };
  }
  function buildDesignBrief(input = {}) {
    const allowedGarments = ['skirt', 'trouser', 'bodice', 'sleeve', 'dress', 'jacket', 'shirt', 'unknown'];
    const allowedSources = ['reference-image', 'ai-generated-style', 'text-description'];
    const garment = allowedGarments.includes(input.garment) ? input.garment : 'unknown';
    const sourceType = allowedSources.includes(input.sourceType) ? input.sourceType : 'text-description';
    const confidence = Number.isFinite(input.confidence) ? Math.max(0, Math.min(1, input.confidence)) : 0.25;
    const features = input.features && typeof input.features === 'object' ? input.features : {};
    const featureKeys = ['silhouette', 'neckline', 'sleeve', 'waistPlacement', 'hem', 'closure', 'fabric', 'details'];
    const normalizedFeatures = Object.fromEntries(featureKeys.map(k => [k, typeof features[k] === 'string' ? features[k].trim().slice(0, 500) : '']));
    return {
      schema: 'patroner.design-brief', schemaVersion: '1.0.0', createdAt: typeof input.createdAt === 'string' ? input.createdAt : null,
      source: { type: sourceType, referenceName: typeof input.referenceName === 'string' ? input.referenceName.slice(0, 255) : '', imageAnalysis: 'not-performed-by-local-engine' },
      garment, stylePrompt: typeof input.stylePrompt === 'string' ? input.stylePrompt.trim().slice(0, 4000) : '',
      features: normalizedFeatures, confidence,
      confidenceMeaning: 'User-estimated interpretation confidence; not a calibrated AI probability.',
      missingInputs: Array.isArray(input.missingInputs) ? input.missingInputs.filter(x => typeof x === 'string').slice(0, 30) : [],
      productionStatus: 'design-intent-only-not-a-production-pattern'
    };
  }


  // v1.28: validate structured output from an external vision-capable model.
  // This validates schema and uncertainty handling; it does not perform image inference.
  const DESIGN_FEATURE_KEYS = Object.freeze([
    'silhouette','neckline','sleeve','waistPlacement','hem','closure','fabric','details',
    'panels','pockets','darts','pleats','gathers','symmetry','grainlineAssumption'
  ]);
  function validateVisionAnalysis(input = {}) {
    const errors = [], warnings = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return { valid: false, errors: ['Vision analysis must be an object.'], warnings, status: 'invalid' };
    }
    const garmentFamilies = ['skirt','trouser','bodice','sleeve','dress','jacket','shirt','unknown'];
    if (!garmentFamilies.includes(input.garment)) errors.push('garment must be a supported garment family.');
    const confidence = input.confidence;
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) errors.push('confidence must be a number between 0 and 1.');
    if (!input.features || typeof input.features !== 'object' || Array.isArray(input.features)) errors.push('features must be an object.');
    const features = {};
    for (const key of DESIGN_FEATURE_KEYS) {
      const raw = input.features && input.features[key];
      if (raw == null || raw === '') { features[key] = { value: '', evidence: 'unknown', confidence: 0 }; continue; }
      if (typeof raw === 'string') {
        features[key] = { value: raw.trim().slice(0, 500), evidence: 'unclassified', confidence: null };
        warnings.push(`Feature "${key}" has no evidence classification; treat it as unconfirmed.`);
      } else if (typeof raw === 'object' && !Array.isArray(raw)) {
        const evidence = ['visible','inferred','unknown'].includes(raw.evidence) ? raw.evidence : 'unknown';
        const value = typeof raw.value === 'string' ? raw.value.trim().slice(0, 500) : '';
        const fc = Number.isFinite(raw.confidence) && raw.confidence >= 0 && raw.confidence <= 1 ? raw.confidence : 0;
        features[key] = { value, evidence, confidence: fc };
        if (evidence === 'inferred' && fc < 0.7) warnings.push(`Feature "${key}" is a low-confidence inference and needs user review.`);
        if (evidence === 'unknown' && value) warnings.push(`Feature "${key}" is marked unknown but contains a value.`);
      } else errors.push(`Feature "${key}" must be a string or evidence object.`);
    }
    const views = Array.isArray(input.views) ? input.views.filter(v => ['front','back','side','detail','flat-front','flat-back'].includes(v)) : [];
    const missingMeasurements = Array.isArray(input.missingMeasurements) ? input.missingMeasurements.filter(x => typeof x === 'string').slice(0, 50) : [];
    const questions = Array.isArray(input.questions) ? input.questions.filter(x => typeof x === 'string').slice(0, 50) : [];
    const unobservable = Array.isArray(input.unobservable) ? input.unobservable.filter(x => typeof x === 'string').slice(0, 50) : [];
    if (input.dimensions && typeof input.dimensions === 'object' && Object.keys(input.dimensions).length) warnings.push('Image-inferred dimensions must not be treated as body measurements unless calibrated against a known reference and confirmed.');
    const confirmationRequired = errors.length > 0 || warnings.length > 0 || confidence < 0.85 || missingMeasurements.length > 0 || questions.length > 0 || Object.values(features).some(f => f.evidence !== 'visible');
    return {
      valid: errors.length === 0, errors, warnings,
      schema: 'patroner.vision-analysis', schemaVersion: '1.0.0',
      garment: garmentFamilies.includes(input.garment) ? input.garment : 'unknown',
      views, features, confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, confidence)) : null,
      missingMeasurements, questions, unobservable, dimensions: {},
      status: errors.length ? 'invalid' : confirmationRequired ? 'requires-user-confirmation' : 'ready-for-design-review',
      productionStatus: 'design-intent-only-not-a-production-pattern'
    };
  }

  // v1.29: convert a reviewed design interpretation plus confirmed body measurements
  // into a deterministic draft operation. This is not pixel-to-pattern AI inference.
  const DRAFT_INPUTS_CM = Object.freeze({
    skirt: ['waist_cm', 'hip_cm', 'hip_depth_cm', 'length_cm'],
    trouser: ['waist_cm', 'hip_cm', 'crotch_depth_cm', 'inseam_cm', 'outseam_cm', 'knee_width_cm', 'hem_width_cm'],
    bodice: ['bust_cm', 'waist_cm', 'shoulder_cm', 'back_length_cm', 'armhole_depth_cm', 'neck_width_cm']
  });
  function buildDraftFromApprovedDesign(input = {}) {
    const errors = [], warnings = [];
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return { valid: false, status: 'blocked', errors: ['Draft request must be an object.'], warnings, pattern: null };
    }
    const analysis = input.analysis;
    if (!analysis || analysis.schema !== 'patroner.vision-analysis' || !['skirt','trouser','bodice','dress','sleeve','jacket','shirt'].includes(analysis.garment)) {
      errors.push('A normalized, supported vision analysis is required.');
    }
    if (input.approved !== true) errors.push('Explicit user approval is required before drafting from interpreted design intent.');
    const garment = analysis && analysis.garment;
    if (garment && !DRAFT_INPUTS_CM[garment]) {
      return { valid: false, status: 'needs-garment-constructor', garment, errors: ['No complete constructor is available for this garment family yet.'], warnings: ['Create compatible garment-specific blocks and assembly rules before generating this family.'], requiredComponents: garment === 'dress' ? ['bodice','skirt','joining-seam-validation'] : ['garment-specific-block-constructor'], pattern: null };
    }
    if (errors.length) return { valid: false, status: 'blocked', errors, warnings, garment: garment || 'unknown', pattern: null };
    const measurements = input.measurements || {};
    const required = DRAFT_INPUTS_CM[garment];
    for (const key of required) {
      if (!Number.isFinite(measurements[key]) || measurements[key] <= 0) errors.push(`Confirmed measurement ${key} must be a positive number in centimetres.`);
    }
    if (errors.length) return { valid: false, status: 'missing-confirmed-measurements', errors, warnings, garment, requiredMeasurements: required, pattern: null };
    const features = analysis.features || {};
    const uncertain = Object.entries(features).filter(([, f]) => f && f.value && f.evidence !== 'visible');
    if (uncertain.length) warnings.push(`Design features requiring review remain: ${uncertain.map(([k]) => k).join(', ')}.`);
    if (analysis.confidence < 0.85) warnings.push('Overall visual interpretation confidence is below 0.85; inspect the reference before production use.');
    let pattern;
    if (garment === 'skirt') {
      const target = { waist_cm: measurements.waist_cm, hip_cm: measurements.hip_cm, hip_depth_cm: measurements.hip_depth_cm, length_cm: measurements.length_cm };
      const base = { ...target };
      pattern = buildGradedSkirtPanel(base, target, {
        waistEaseCm: Number.isFinite(measurements.waist_ease_cm) ? measurements.waist_ease_cm : 0,
        hipEaseCm: Number.isFinite(measurements.hip_ease_cm) ? measurements.hip_ease_cm : 0,
        dartIntakeCm: Number.isFinite(measurements.dart_cm) ? measurements.dart_cm : 0,
        curveSamples: Number.isInteger(input.curveSamples) ? input.curveSamples : 16
      });
    } else if (garment === 'trouser') {
      pattern = buildTrouserPanel({
        hipWidthMm: measurements.hip_cm * 2.5,
        crotchExtensionMm: (Number.isFinite(measurements.crotch_extension_cm) ? measurements.crotch_extension_cm : measurements.hip_cm * 0.12) * 10,
        crotchDepthMm: measurements.crotch_depth_cm * 10,
        inseamMm: measurements.inseam_cm * 10,
        outseamMm: measurements.outseam_cm * 10,
        kneeWidthMm: measurements.knee_width_cm * 10,
        hemWidthMm: measurements.hem_width_cm * 10
      });
    } else {
      pattern = buildBodicePanel({
        bustWidthMm: measurements.bust_cm * 2.5,
        waistWidthMm: measurements.waist_cm * 2.5,
        shoulderMm: measurements.shoulder_cm * 10,
        backLengthMm: measurements.back_length_cm * 10,
        armholeDepthMm: measurements.armhole_depth_cm * 10,
        neckWidthMm: measurements.neck_width_cm * 10
      });
    }
    const outline = pattern.outline;
    const geometry = analyzePolygon(outline);
    if (!geometry.valid) errors.push(...geometry.errors.map(e => `Generated geometry: ${e}`));
    if (pattern.status === 'experimental-scaffold') warnings.push(`${garment} constructor is an experimental scaffold, not a professionally validated production block.`);
    return {
      valid: errors.length === 0, status: errors.length ? 'geometry-review-required' : 'draft-generated-review-required',
      schema: 'patroner.draft-generation-report', schemaVersion: '1.0.0', garment,
      source: { analysisSchema: analysis.schema, analysisVersion: analysis.schemaVersion, userApproved: true, featureEvidence: Object.fromEntries(Object.entries(features).map(([k, f]) => [k, f && f.evidence || 'unknown'])) },
      units: 'mm', requiredMeasurementsCm: Object.fromEntries(required.map(k => [k, measurements[k]])),
      construction: { blockVersion: pattern.blockVersion || 'skirt.curve-regeneration.v1', method: garment === 'skirt' ? 'parametric-curve-regeneration' : 'experimental-parametric-scaffold' },
      pattern: { outline, geometry, curveSamples: pattern.curveSamples || null }, errors, warnings,
      limitations: ['Image interpretation supplies design intent, not exact dimensions.', 'This report does not certify fit, seam compatibility, seam allowances, or production readiness.', 'Review geometry, add required construction details, and validate with a professional toile before cutting final fabric.']
    };
  }

  // Assembly graph captures piece-to-piece joins separately from geometry generation.
  function validateAssemblyGraph(graph = {}) {
    const errors = [], warnings = [];
    if (!graph || typeof graph !== 'object' || !Array.isArray(graph.pieces) || !Array.isArray(graph.joins)) {
      return { valid: false, errors: ['Assembly graph requires pieces and joins arrays.'], warnings, components: [] };
    }
    const ids = new Set();
    for (const piece of graph.pieces) {
      if (!piece || typeof piece.id !== 'string' || !piece.id.trim()) { errors.push('Every assembly piece requires a non-empty id.'); continue; }
      if (ids.has(piece.id)) errors.push(`Duplicate assembly piece id: ${piece.id}.`);
      ids.add(piece.id);
    }
    const joinIds = new Set(), adjacency = new Map([...ids].map(id => [id, new Set()]));
    for (const join of graph.joins) {
      if (!join || typeof join !== 'object') { errors.push('Every join must be an object.'); continue; }
      if (typeof join.id !== 'string' || !join.id.trim()) errors.push('Every join requires a non-empty id.');
      else if (joinIds.has(join.id)) errors.push(`Duplicate join id: ${join.id}.`); else joinIds.add(join.id);
      if (!ids.has(join.pieceA)) errors.push(`Join ${join.id || '(unnamed)'} references unknown pieceA "${join.pieceA}".`);
      if (!ids.has(join.pieceB)) errors.push(`Join ${join.id || '(unnamed)'} references unknown pieceB "${join.pieceB}".`);
      if (join.pieceA === join.pieceB) errors.push(`Join ${join.id || '(unnamed)'} cannot connect a piece to itself.`);
      if (ids.has(join.pieceA) && ids.has(join.pieceB) && join.pieceA !== join.pieceB) {
        adjacency.get(join.pieceA).add(join.pieceB); adjacency.get(join.pieceB).add(join.pieceA);
      }
      if (typeof join.seamA !== 'string' || !join.seamA.trim() || typeof join.seamB !== 'string' || !join.seamB.trim()) {
        warnings.push(`Join ${join.id || '(unnamed)'} needs named seam identifiers before seam compatibility can be checked.`);
      }
    }
    const visited = new Set(), components = [];
    for (const id of ids) {
      if (visited.has(id)) continue;
      const stack = [id], component = []; visited.add(id);
      while (stack.length) {
        const current = stack.pop(); component.push(current);
        for (const next of adjacency.get(current) || []) if (!visited.has(next)) { visited.add(next); stack.push(next); }
      }
      components.push(component);
    }
    if (components.length > 1) warnings.push(`Assembly contains ${components.length} disconnected components; confirm whether these are separate garment subassemblies.`);
    if (graph.pieces.length > 1 && graph.joins.length === 0) warnings.push('Multiple pieces have no joins defined.');
    return { valid: errors.length === 0, errors, warnings, pieceCount: graph.pieces.length, joinCount: graph.joins.length, components, connected: components.length <= 1, graphVersion: graph.version || '1.0.0' };
  }

  root.PatronerDraftingEngine = Object.freeze({
    SIZE_CHART, SIZE_ORDER, BASE_SIZE, getGradingRows,
    MEASUREMENT_SCHEMA_VERSION, MEASUREMENT_SCHEMAS, LANDMARK_SCHEMA_VERSION,
    SKIRT_LANDMARK_SCHEMA, GRADING_RULESET_VERSION, PROVISIONAL_SKIRT_GRADE_RULESET,
    validateMeasurementSet, getGradingProfile, validateGradeRuleSet, applyLandmarkGradeRules,
    buildGradedMeasurements, validateMeasurements, applyPointGrading,
    GEOMETRY_TOLERANCE_MM, distance, signedArea, polylineLength, segmentsIntersect,
    polygonSelfIntersections, analyzePolygon, compareSeamLengths, offsetPolygon,
    buildSkirtPanel, buildGradedSkirtPanel, buildTrouserPanel, buildBodicePanel, buildDart, buildNotch, validateSeamAllowance, validateSeamAllowanceDistance, validatePatternPieceMetadata, compareSeamPair, validatePatternAssembly, validatePrintCalibration, validateTileContinuity, FABRIC_DIRECTIONS, RULE_TYPES, validateRuleStack, evaluateRuleStack, buildDesignBrief, DESIGN_FEATURE_KEYS, validateVisionAnalysis, DRAFT_INPUTS_CM, buildDraftFromApprovedDesign, validateAssemblyGraph
  });
})(typeof window !== 'undefined' ? window : globalThis);
