'use strict';
const assert = require('node:assert/strict');
require('../src/drafting-engine.js');
const E = globalThis.PatronerDraftingEngine;

assert.deepEqual(E.SIZE_ORDER, ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
assert.equal(E.getGradingRows().length, 6);
for (let i = 1; i < E.SIZE_ORDER.length; i++) {
  const prev = E.SIZE_CHART[E.SIZE_ORDER[i - 1]];
  const curr = E.SIZE_CHART[E.SIZE_ORDER[i]];
  assert.ok(curr.waist > prev.waist, 'waist must increase with size');
  assert.ok(curr.hip > prev.hip, 'hip must increase with size');
}
assert.throws(() => E.buildGradedMeasurements('XXXL'), /Unsupported standard size/);

const base = { waist_cm:72, hip_cm:96, hip_depth_cm:20, length_cm:60 };
const target = { waist_cm:80, hip_cm:104, hip_depth_cm:21, length_cm:62 };
const outline = [[0,0],[200,0], [210,20], [220,40], [230,60], [240,80], [250,100], [260,120], [270,140], [280,160], [290,180], [300,190], [310,195], [320,200], [320,600], [0,600]];
const graded = E.applyPointGrading(outline, base, target);
assert.equal(graded.length, 16);
assert.deepEqual(graded[0], [0,0], 'fold waist remains anchored');
assert.deepEqual(graded[1], [220,0], 'waist point moves by 8 cm * 2.5 mm');
assert.deepEqual(graded[14], [340,620], 'side hem applies hip and length deltas');
assert.deepEqual(graded[15], [0,620], 'fold hem applies length delta only');
const unchanged = E.applyPointGrading(outline, base, base);
assert.deepEqual(unchanged, outline, 'grading base size must be an identity transform');
assert.throws(() => E.applyPointGrading(outline.slice(0, 15), base, target), /16-point outline/);
assert.throws(() => E.applyPointGrading(outline, base, {...target, hip_cm:NaN}), /finite hip_cm/);

const valid = {waist_cm:72,hip_cm:96,hip_depth_cm:20,length_cm:60,waist_ease_cm:1,hip_ease_cm:4,seam_allowance_cm:1,hem_allowance_cm:3,dart_cm:2};
assert.deepEqual(E.validateMeasurements(valid).errors, []);
assert.ok(E.validateMeasurements({...valid, waist_cm:0}).errors.length > 0);
assert.ok(E.validateMeasurements({...valid, dart_cm:-1}).errors.length > 0);

// Geometry engine: signed area, perimeter, intersections, offsets, and seam compatibility.
const rect = [[0,0],[100,0],[100,50],[0,50]];
const rectAnalysis = E.analyzePolygon(rect);
assert.equal(rectAnalysis.valid, true);
assert.equal(rectAnalysis.absoluteAreaMm2, 5000);
assert.equal(rectAnalysis.perimeterMm, 300);
assert.equal(rectAnalysis.bounds.widthMm, 100);
assert.equal(rectAnalysis.bounds.heightMm, 50);
assert.equal(E.analyzePolygon([[0,0],[100,100],[0,100],[100,0]]).valid, false, 'bow-tie polygon must fail');
assert.equal(E.analyzePolygon([[0,0],[100,0],[100,0],[0,50]]).valid, false, 'duplicate adjacent vertex must fail');
assert.equal(E.analyzePolygon([[0,0],[1,1]]).valid, false, 'too few points must fail safely');
assert.equal(E.segmentsIntersect([0,0],[10,10],[0,10],[10,0]), true);
assert.equal(E.segmentsIntersect([0,0],[10,0],[5,0],[15,0]), true, 'collinear overlap must be detected');
assert.equal(E.compareSeamLengths([[0,0],[100,0]], [[0,0],[101,0]], {toleranceMm:2}).compatible, true);
assert.equal(E.compareSeamLengths([[0,0],[100,0]], [[0,0],[105,0]], {toleranceMm:2}).compatible, false);
const expanded = E.offsetPolygon(rect, 5);
const expandedAnalysis = E.analyzePolygon(expanded);
assert.equal(expandedAnalysis.valid, true);
assert.ok(Math.abs(expandedAnalysis.bounds.widthMm - 110) < 1e-6);
assert.ok(Math.abs(expandedAnalysis.bounds.heightMm - 60) < 1e-6);
assert.throws(() => E.offsetPolygon([[0,0],[1,1],[2,2]], 5), /degenerate/);

// Regression fixture: draft the app's current 16-point sample block for every standard size.
function sampleSkirtOutline(profile) {
  const waistQuarter = (profile.waist + 1) * 2.5;
  const hipQuarter = (profile.hip + 4) * 2.5;
  const waistTop = waistQuarter + 20;
  const hy = profile.depth * 10, ly = profile.length * 10;
  const control = [waistTop + (hipQuarter - waistTop) * 0.82, hy * 0.34];
  const side = [];
  for (let i = 1; i <= 12; i++) {
    const t = i / 12, u = 1 - t;
    side.push([u*u*waistTop + 2*u*t*control[0] + t*t*hipQuarter, 2*u*t*control[1] + t*t*hy]);
  }
  return [[0,0],[waistTop,0],...side,[hipQuarter,ly],[0,ly]];
}
function appStyleOffset(points, d) {
  const orient = E.signedArea(points) >= 0 ? 1 : -1;
  const lines = points.map((a,i) => {
    const b=points[(i+1)%points.length], dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1;
    return {a:[a[0]+orient*dy/len*d,a[1]-orient*dx/len*d],v:[dx,dy]};
  });
  const out=[];
  for(let i=0;i<points.length;i++){
    const l1=lines[(i+points.length-1)%points.length],l2=lines[i];
    const cross=l1.v[0]*l2.v[1]-l1.v[1]*l2.v[0];
    if(Math.abs(cross)<1e-8){out.push([points[i][0],points[i][1]]);continue;}
    const qx=l2.a[0]-l1.a[0],qy=l2.a[1]-l1.a[1],t=(qx*l2.v[1]-qy*l2.v[0])/cross;
    out.push([Math.max(0,l1.a[0]+t*l1.v[0]),l1.a[1]+t*l1.v[1]]);
  }
  return out;
}
for (const size of E.SIZE_ORDER) {
  const outline = sampleSkirtOutline(E.SIZE_CHART[size]);
  const cut = appStyleOffset(outline, 10);
  assert.equal(outline.length, 16, `${size} outline schema`);
  assert.equal(E.analyzePolygon(outline).valid, true, `${size} stitch outline topology`);
  assert.equal(E.analyzePolygon(cut).valid, true, `${size} cut outline topology`);
  assert.ok(Math.abs(outline[0][0] - outline[15][0]) < 1e-8, `${size} fold anchors aligned`);
}
console.log('PASS: default skirt outline and cut topology regression across all six standard sizes.');

// v1.23 canonical construction primitives: block, dart, notch, seam allowance report.
const block = E.buildSkirtPanel({ waistWidthMm: 180, hipWidthMm: 250, hipDepthMm: 200, lengthMm: 600, dartIntakeMm: 20 });
assert.equal(block.outline.length, 16, '12 curve samples plus four anchor vertices');
assert.equal(block.waistTopMm, 200);
assert.equal(E.analyzePolygon(block.outline).valid, true);
assert.equal(E.buildSkirtPanel({ waistWidthMm: 180, hipWidthMm: 250, hipDepthMm: 200, lengthMm: 600, dartIntakeMm: 0 }).outline[1][0], 180);
assert.throws(() => E.buildSkirtPanel({ waistWidthMm: 180, hipWidthMm: 250, hipDepthMm: 200, lengthMm: 600, dartIntakeMm: 181 }), /cannot exceed/);
assert.throws(() => E.buildSkirtPanel({ waistWidthMm: 180, hipWidthMm: 250, hipDepthMm: 200, lengthMm: 600, curveSamples: 1 }), /curveSamples/);
const dart = E.buildDart({ centerXmm: 100, intakeMm: 20, depthMm: 60 });
assert.equal(dart.active, true);
assert.deepEqual(dart.legs, [[90,0],[100,60],[110,0]]);
assert.equal(E.buildDart({ centerXmm: 100, intakeMm: 0, depthMm: 60 }).active, false);
assert.throws(() => E.buildDart({ centerXmm: 100, intakeMm: -1, depthMm: 60 }), /cannot be negative/);
const notch = E.buildNotch({ point: [100,100], tangent: [100,120], depthMm: 4, widthMm: 6 });
assert.deepEqual(notch.points, [[100,97],[96,100],[100,103]]);
assert.throws(() => E.buildNotch({ point: [0,0], tangent: [0,0] }), /non-zero length/);
const seamReport = E.validateSeamAllowance(rect, expanded);
assert.equal(seamReport.valid, true);
assert.ok(seamReport.note.includes('do not prove a uniform seam allowance'));
console.log('PASS: v1.23 canonical skirt block construction, dart geometry, seam notch construction, and seam-allowance diagnostic contract.');

// v1.24 versioned measurement schema, named landmarks, and grade-rule contract.
assert.equal(E.MEASUREMENT_SCHEMA_VERSION, '1.0.0');
assert.equal(E.MEASUREMENT_SCHEMAS['skirt.body.v1'].fields.length, 4);
const schemaValid = E.validateMeasurementSet({ waist_cm:72, hip_cm:96, hip_depth_cm:20, length_cm:60 });
assert.equal(schemaValid.valid, true);
assert.equal(schemaValid.schemaId, 'skirt.body.v1');
assert.equal(E.validateMeasurementSet({ waist_cm:72, hip_cm:0, hip_depth_cm:20, length_cm:60 }).valid, false, 'zero circumference must fail schema validation');

assert.throws(() => E.validateMeasurementSet({}, 'unknown.schema'), /Unknown measurement schema/);
assert.equal(E.SKIRT_LANDMARK_SCHEMA.points.find(p => p.id === 'SIDE_HIP').index, 13);
const gradeSetCheck = E.validateGradeRuleSet(E.PROVISIONAL_SKIRT_GRADE_RULESET);
assert.equal(gradeSetCheck.valid, true);
assert.ok(gradeSetCheck.warnings.some(w => w.includes('professional reference-block')));
const incompleteRules = { ...E.PROVISIONAL_SKIRT_GRADE_RULESET, rules: { SIDE_WAIST: { waist: 1, hip: 0, hip_depth: 0, length: 0 } } };
assert.equal(E.validateGradeRuleSet(incompleteRules).valid, false);
const baseNamed = [
  {id:'CF_FOLD_WAIST',x:0,y:0}, {id:'SIDE_WAIST',x:200,y:0},
  {id:'SIDE_HIP',x:250,y:200}, {id:'SIDE_HEM',x:260,y:600}, {id:'CF_FOLD_HEM',x:0,y:600}
];
const sameGrade = E.applyLandmarkGradeRules(baseNamed, {waist:0,hip:0,hip_depth:0,length:0});
assert.deepEqual(sameGrade, baseNamed, 'named landmark grading must be an identity transform at base size');
const nextGrade = E.applyLandmarkGradeRules(baseNamed, {waist:4,hip:4,hip_depth:1,length:0});
assert.deepEqual(nextGrade.find(p => p.id === 'SIDE_WAIST'), {id:'SIDE_WAIST',x:210,y:0});
assert.deepEqual(nextGrade.find(p => p.id === 'SIDE_HIP'), {id:'SIDE_HIP',x:260,y:210});
assert.deepEqual(nextGrade.find(p => p.id === 'CF_FOLD_WAIST'), {id:'CF_FOLD_WAIST',x:0,y:0});
assert.throws(() => E.applyLandmarkGradeRules(baseNamed, {waist:0,hip:0,hip_depth:NaN,length:0}), /finite centimetres/);
assert.deepEqual(E.getGradingProfile('M').deltaCm, {waist:0,hip:0,hip_depth:0,length:0});
assert.equal(E.getGradingProfile('L').gradingRuleSetVersion, E.GRADING_RULESET_VERSION);
console.log('PASS: v1.24 versioned measurement schemas, named landmarks, grade-rule validation, identity grading, and deterministic landmark deltas.');


console.log('PASS: geometry area/perimeter/bounds, self-intersection, collinear overlap, seam tolerance, offset, and degenerate-shape guards.');
console.log('PASS: 6 sizes, monotonic chart, input validation, 16-point grading, identity transform, and failure cases.');


// v1.25 curve-aware regeneration and multi-garment measurement/block foundations.
assert.equal(E.MEASUREMENT_SCHEMAS['trouser.body.v1'].fields.length, 6);
assert.equal(E.MEASUREMENT_SCHEMAS['bodice.body.v1'].fields.length, 6);
assert.equal(E.validateMeasurementSet({waist_cm:78,hip_cm:102,crotch_depth_cm:27,inseam_cm:78,outseam_cm:105,leg_opening_cm:42}, 'trouser.body.v1').valid, true);
assert.equal(E.validateMeasurementSet({bust_cm:94,waist_cm:74,shoulder_cm:13,back_length_cm:41,armhole_depth_cm:21,neck_width_cm:9}, 'bodice.body.v1').valid, true);
assert.equal(E.validateMeasurementSet({bust_cm:94,waist_cm:74,shoulder_cm:13,back_length_cm:41,armhole_depth_cm:21}, 'bodice.body.v1').valid, false);
const curveGraded = E.buildGradedSkirtPanel(base, target, {waistEaseCm:1, hipEaseCm:4, dartIntakeCm:2, curveSamples:12});
assert.equal(curveGraded.outline.length, 16);
assert.equal(E.analyzePolygon(curveGraded.outline).valid, true);
assert.equal(curveGraded.outline[1][0], (target.waist_cm+1)*2.5 + 20, 'target waist curve is regenerated with target dart intake');
assert.equal(curveGraded.outline[13][1], target.hip_depth_cm*10, 'target hip landmark is regenerated from target hip depth');
assert.equal(curveGraded.outline[14][1], target.length_cm*10, 'target hem is regenerated from target length');
assert.equal(curveGraded.grading.method, 'curve-regeneration-v1');
const curveBase = E.buildGradedSkirtPanel(base, base, {waistEaseCm:1, hipEaseCm:4, dartIntakeCm:2});
assert.deepEqual(curveBase.outline, E.buildSkirtPanel({waistWidthMm:(base.waist_cm+1)*2.5,hipWidthMm:(base.hip_cm+4)*2.5,hipDepthMm:base.hip_depth_cm*10,lengthMm:base.length_cm*10,dartIntakeMm:20,curveSamples:12,controlWidthRatio:0.82,controlDepthRatio:0.34}).outline);
assert.throws(() => E.buildGradedSkirtPanel(base, {...target, hip_cm:NaN}), /finite hip_cm/);
const trouserBlock = E.buildTrouserPanel({hipWidthMm:260,crotchExtensionMm:80,crotchDepthMm:240,inseamMm:760,outseamMm:1050,kneeWidthMm:220,hemWidthMm:200});
assert.equal(trouserBlock.garment, 'trouser');
assert.equal(trouserBlock.analysis.valid, true);
assert.ok(trouserBlock.analysis.bounds.minX >= 0, 'trouser scaffold should use non-negative local coordinates');
assert.throws(() => E.buildTrouserPanel({hipWidthMm:260,crotchExtensionMm:80,crotchDepthMm:240,inseamMm:1060,outseamMm:1050,kneeWidthMm:220,hemWidthMm:200}), /inseamMm must be less/);
const bodiceBlock = E.buildBodicePanel({bustWidthMm:250,waistWidthMm:190,shoulderMm:130,backLengthMm:420,armholeDepthMm:220,neckWidthMm:90});
assert.equal(bodiceBlock.garment, 'bodice');
assert.equal(bodiceBlock.analysis.valid, true);
assert.throws(() => E.buildBodicePanel({bustWidthMm:250,waistWidthMm:190,shoulderMm:130,backLengthMm:220,armholeDepthMm:220,neckWidthMm:90}), /armholeDepthMm must be less/);
console.log('PASS: v1.25 curve-aware skirt regeneration, trouser/bodice measurement schemas, and experimental multi-garment block constructors.');


// v1.26 shared rule pipeline and image/AI-style design brief contract.
assert.ok(E.RULE_TYPES.includes('design-confidence-minimum'));
const ruleStack = {id:'test-stack',version:'1.0',status:'provisional',rules:[
  {id:'measurements',type:'measurement-positive',garments:['*'],params:{fields:['waist_cm','hip_cm']}},
  {id:'grainline',type:'grainline-required',garments:['*'],severity:'warning'},
  {id:'confidence',type:'design-confidence-minimum',garments:['*'],severity:'warning',params:{minimum:0.6}},
  {id:'geometry',type:'geometry-valid',garments:['*'],severity:'warning'}
]};
assert.equal(E.validateRuleStack(ruleStack).valid,true);
const ruleRun = E.evaluateRuleStack({garment:'skirt',measurements:{waist_cm:70,hip_cm:96},patternPieces:[{grainline:true}],designSpec:{confidence:0.8},geometry:{valid:true}},ruleStack);
assert.equal(ruleRun.valid,true);
assert.equal(ruleRun.results.length,4);
const ruleFail = E.evaluateRuleStack({garment:'bodice',measurements:{waist_cm:0,hip_cm:90},patternPieces:[{grainline:false}],designSpec:{confidence:0.2},geometry:{valid:false}},ruleStack);
assert.equal(ruleFail.valid,false);
assert.equal(ruleFail.results.filter(r=>!r.passed).length,4);
assert.equal(E.validateRuleStack({...ruleStack,rules:[...ruleStack.rules,ruleStack.rules[0]]}).valid,false);
const brief = E.buildDesignBrief({sourceType:'ai-generated-style',garment:'dress',confidence:1.5,stylePrompt:'Romantic long dress',features:{silhouette:'A-line',details:'pleats'}});
assert.equal(brief.schema,'patroner.design-brief');
assert.equal(brief.source.type,'ai-generated-style');
assert.equal(brief.garment,'dress');
assert.equal(brief.confidence,1);
assert.equal(brief.features.silhouette,'A-line');
assert.equal(brief.productionStatus,'design-intent-only-not-a-production-pattern');
assert.equal(E.buildDesignBrief({sourceType:'not-real',garment:'not-real'}).garment,'unknown');
console.log('PASS: v1.26 multi-rule pipeline, garment filters, severity handling, and image/AI-style design brief schema.');


// v1.27 manufacturing metadata, seam-pair, allowance sampling, print scale, and tile continuity.
assert.ok(E.RULE_TYPES.includes('piece-metadata-valid'));
assert.ok(E.RULE_TYPES.includes('print-calibration-valid'));
const manufacturingPiece = {
  id: 'skirt-front', name: 'Skirt front', garment: 'skirt', outline: rect,
  grainline: { start: [50, 10], end: [50, 90] }, cutQuantity: 1,
  onFold: false, fabricDirection: 'lengthwise', seamAllowanceMm: 10
};
assert.equal(E.validatePatternPieceMetadata(manufacturingPiece).valid, true);
assert.equal(E.validatePatternPieceMetadata({...manufacturingPiece, cutQuantity: 0}).valid, false);
assert.equal(E.validatePatternPieceMetadata({...manufacturingPiece, grainline: null}).valid, false);
assert.equal(E.validatePatternPieceMetadata({...manufacturingPiece, onFold: true, grainline: null}).valid, true);
const seamPair = E.compareSeamPair(
  {pieceId:'front',seamId:'side',points:[[0,0],[0,100]]},
  {pieceId:'back',seamId:'side',points:[[0,0],[0,101]]}, {toleranceMm:2}
);
assert.equal(seamPair.compatible, true);
assert.equal(seamPair.deltaMm, 1);
assert.equal(E.compareSeamPair(
  {pieceId:'front',seamId:'side',points:[[0,0],[0,100]]},
  {pieceId:'back',seamId:'side',points:[[0,0],[0,105]]}, {toleranceMm:2}
).compatible, false);
const assembly = E.validatePatternAssembly([manufacturingPiece], [{id:'side-seam',a:{pieceId:'skirt-front',seamId:'side',points:[[0,0],[0,100]]},b:{pieceId:'skirt-back',seamId:'side',points:[[0,0],[0,101]]}}], {seamToleranceMm:2});
assert.equal(assembly.valid, true);
assert.equal(E.validatePatternAssembly([manufacturingPiece, manufacturingPiece]).valid, false, 'duplicate piece IDs must fail');
assert.equal(E.validatePrintCalibration({expectedMm:100,measuredMm:100,tolerancePercent:0.5}).valid, true);
assert.equal(E.validatePrintCalibration({expectedMm:100,measuredMm:98,tolerancePercent:0.5}).valid, false);
assert.equal(E.validatePrintCalibration({expectedMm:100,measuredMm:NaN}).valid, false);
assert.equal(E.validateTileContinuity({start:[0,0],end:[10,0]},{start:[10.4,0],end:[20,0]},{toleranceMm:0.5}).valid, true);
assert.equal(E.validateTileContinuity({start:[0,0],end:[10,0]},{start:[15,0],end:[20,0]},{toleranceMm:1}).valid, false);
const rectCut = E.offsetPolygon(rect, 10);
const allowanceDistance = E.validateSeamAllowanceDistance(rect, rectCut, 10, {excludedEdges:[],toleranceMm:0.01});
assert.equal(allowanceDistance.valid, true, JSON.stringify(allowanceDistance.errors));
const allowanceWithFold = E.validateSeamAllowanceDistance(rect, rectCut, 10, {excludedEdges:[3],toleranceMm:0.01});
assert.equal(allowanceWithFold.valid, true);
const extendedStack = {id:'manufacturing',version:'1.0',status:'provisional',rules:[
  {id:'piece-metadata',type:'piece-metadata-valid',garments:['*'],severity:'error'},
  {id:'print-calibration',type:'print-calibration-valid',garments:['*'],severity:'warning'}
]};
const extendedRun = E.evaluateRuleStack({garment:'skirt',patternPieces:[manufacturingPiece],printCalibration:E.validatePrintCalibration({expectedMm:100,measuredMm:100})},extendedStack);
assert.equal(extendedRun.valid, true);
assert.equal(extendedRun.results.length, 2);
console.log('PASS: v1.27 manufacturing piece contracts, seam-pair matching, seam-allowance distance sampling, print calibration, and tile continuity diagnostics.');


// v1.28: structured vision-analysis contract and garment assembly graph.
const vision = E.validateVisionAnalysis({
  garment: 'dress', confidence: 0.78, views: ['front','back'],
  features: {
    silhouette: { value: 'A-line midi', evidence: 'visible', confidence: 0.95 },
    neckline: { value: 'square', evidence: 'inferred', confidence: 0.62 },
    fabric: { value: 'woven cotton', evidence: 'unknown', confidence: 0.2 }
  },
  missingMeasurements: ['bust_cm','waist_cm','hip_cm'], questions: ['Is the back closure a zip?'],
  unobservable: ['internal facing construction']
});
assert.equal(vision.valid, true);
assert.equal(vision.status, 'requires-user-confirmation');
assert.ok(vision.warnings.length > 0);
assert.deepEqual(vision.dimensions, {}, 'unverified image dimensions must not enter accepted design specification');
assert.equal(E.validateVisionAnalysis({garment:'dress',confidence:2,features:{}}).valid, false);
const cleanVision = E.validateVisionAnalysis({
  garment:'skirt', confidence:0.9, views:['front'],
  features: Object.fromEntries(E.DESIGN_FEATURE_KEYS.map(k => [k, {value:k === 'silhouette' ? 'straight' : '', evidence:k === 'silhouette' ? 'visible' : 'unknown', confidence:k === 'silhouette' ? 0.95 : 0}]))
});
assert.equal(cleanVision.valid, true);
assert.equal(cleanVision.status, 'requires-user-confirmation', 'unknown feature values require confirmation');

const assemblyGood = E.validateAssemblyGraph({
  version:'1.0.0',
  pieces:[{id:'bodice-front'},{id:'bodice-back'},{id:'sleeve-left'}],
  joins:[
    {id:'side-seam',pieceA:'bodice-front',pieceB:'bodice-back',seamA:'front-side',seamB:'back-side'},
    {id:'armhole',pieceA:'bodice-front',pieceB:'sleeve-left',seamA:'armhole-front',seamB:'cap-front'}
  ]
});
assert.equal(assemblyGood.valid, true);
assert.equal(assemblyGood.connected, true);
assert.equal(assemblyGood.components.length, 1);
const assemblyBad = E.validateAssemblyGraph({
  pieces:[{id:'front'},{id:'front'},{id:'back'}],
  joins:[{id:'join1',pieceA:'front',pieceB:'missing',seamA:'a',seamB:'b'}]
});
assert.equal(assemblyBad.valid, false);
assert.ok(assemblyBad.errors.some(e => e.includes('Duplicate assembly piece id')));
assert.ok(assemblyBad.errors.some(e => e.includes('unknown pieceB')));
const assemblyDisconnected = E.validateAssemblyGraph({pieces:[{id:'a'},{id:'b'}],joins:[]});
assert.equal(assemblyDisconnected.valid, true);
assert.equal(assemblyDisconnected.connected, false);
assert.ok(assemblyDisconnected.warnings.length);
console.log('PASS: v1.28 vision-analysis evidence contract, uncertainty gates, and assembly graph validation.');

// v1.29: approved design intent -> deterministic parametric draft pipeline.
const draftAnalysis = E.validateVisionAnalysis({
  garment: 'skirt', confidence: 0.92, views: ['front','flat-front'],
  features: { silhouette: { value: 'A-line', evidence: 'visible', confidence: 0.95 } },
  missingMeasurements: [], questions: [], unobservable: []
});
const approvalBlocked = E.buildDraftFromApprovedDesign({analysis:draftAnalysis, measurements:{waist_cm:72,hip_cm:96,hip_depth_cm:20,length_cm:60}, approved:false});
assert.equal(approvalBlocked.valid, false);
assert.equal(approvalBlocked.status, 'blocked');
const measurementsBlocked = E.buildDraftFromApprovedDesign({analysis:draftAnalysis, measurements:{waist_cm:72,hip_cm:96}, approved:true});
assert.equal(measurementsBlocked.valid, false);
assert.equal(measurementsBlocked.status, 'missing-confirmed-measurements');
const skirtDraft = E.buildDraftFromApprovedDesign({
  analysis:draftAnalysis, approved:true,
  measurements:{waist_cm:72,hip_cm:96,hip_depth_cm:20,length_cm:60,waist_ease_cm:1,hip_ease_cm:4,dart_cm:2},
  curveSamples:16
});
assert.equal(skirtDraft.valid, true, JSON.stringify(skirtDraft.errors));
assert.equal(skirtDraft.schema, 'patroner.draft-generation-report');
assert.equal(skirtDraft.garment, 'skirt');
assert.equal(skirtDraft.pattern.curveSamples, 16);
assert.equal(skirtDraft.pattern.geometry.valid, true);
assert.equal(skirtDraft.source.userApproved, true);
const dressBlocked = E.buildDraftFromApprovedDesign({analysis:{schema:'patroner.vision-analysis',schemaVersion:'1.0.0',garment:'dress',features:{},confidence:0.9},approved:true,measurements:{}});
assert.equal(dressBlocked.status, 'needs-garment-constructor');
assert.ok(dressBlocked.requiredComponents.includes('bodice'));
assert.throws(() => E.buildDraftFromApprovedDesign({analysis:draftAnalysis,approved:true,measurements:{waist_cm:72,hip_cm:96,hip_depth_cm:20,length_cm:60,dart_cm:100}}), /Dart intake cannot exceed/);
console.log('PASS: v1.29 reviewed design-to-draft pipeline, explicit approval gate, confirmed measurement requirements, deterministic skirt geometry, and unsupported-family guard.');
