/** Authoritative, deterministic source for the Visual Spec 1.0 JSON Schema distribution. */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
const base = 'https://visualspec.dev/schema/1.0/';
const out = resolve('packages/schema/schema/1.0');
const dialect = 'https://json-schema.org/draft/2020-12/schema';
const schemas = new Map();
const s = (description) => ({ type: 'string', minLength: 1, ...(description ? {description} : {}) });
const n = (min, max) => ({ type: 'number', ...(min !== undefined ? {minimum:min}:{}), ...(max !== undefined ? {maximum:max}:{}) });
const i = (min = 0) => ({type:'integer',minimum:min});
const b = {type:'boolean'};
const en = (...values) => ({enum:values});
const a = (items, min = 0) => ({type:'array',items,...(min?{minItems:min}:{})});
const unique = (items,min=0) => ({...a(items,min),uniqueItems:true});
const ref = (mod,def) => ({$ref:`${base}modules/${mod}.schema.json${def?`#/$defs/${def}`:''}`});
const common = name => ref('common',name);
const map = (values) => ({type:'object',additionalProperties:values});
const obj = (properties,required=[],description) => ({type:'object',...(description?{description}:{}),properties, ...(required.length?{required}:{}),additionalProperties:false});
const ext = (properties,required=[],description) => obj({...properties,extensions:common('extensions')},required,description);
const one = (...anyOf) => ({anyOf});
const ids = () => unique(common('id'));
const timed = {from:common('time'),to:common('time')};
function module(name,description,defs,main) {
 const schema={$schema:dialect,$id:`${base}modules/${name}.schema.json`,title:name.split('-').map(v=>v[0].toUpperCase()+v.slice(1)).join(' '),description,$defs:defs,...(main?{$ref:`#/$defs/${main}`}:{})};
 schemas.set(`modules/${name}.schema.json`,schema);return schema;
}
module('common','Shared constrained identifiers, values, units, bounds, provenance and extension payloads.',{
 id:{...s('Stable document-wide identifier; references resolve locally, never through network execution.'),pattern:'^[A-Za-z_][A-Za-z0-9_.:/-]*$'},
 taxonomy:{...s('Open taxonomy. Standard terms and namespaced vendor terms are accepted.'),pattern:'^[a-zA-Z][a-zA-Z0-9_-]*(?:[.:/][a-zA-Z0-9_-]+)*$'},
 uri:{type:'string',format:'uri-reference',minLength:1},
 time:one(n(0),{type:'string',pattern:'^(?:0|[0-9]+(?:\\.[0-9]+)?)(?:ms|s|f)$',description:'Nonnegative time in seconds (number), an ms/s/f string, or {value,unit}.'},obj({value:n(0),unit:en('ms','s','f')},['value','unit'])),
 duration:one(n(0),{type:'string',pattern:'^(?:0|[0-9]+(?:\\.[0-9]+)?)(?:ms|s|f)$'},obj({value:n(0),unit:en('ms','s','f')},['value','unit'])),
 delay:one(n(),{type:'string',pattern:'^-?(?:0|[0-9]+(?:\\.[0-9]+)?)(?:ms|s|f)$'},obj({value:n(),unit:en('ms','s','f')},['value','unit'])),
 dimension:one({type:'number'}, {type:'string',pattern:'^-?[0-9]+(?:\\.[0-9]+)?(?:px|%|rem|em|pt|mm|cm|in|vw|vh|vmin|vmax|m)$'},obj({value:{type:'number'},unit:en('px','%','rem','em','pt','mm','cm','in','vw','vh','m'),confidence:n(0,1),provenance:common('provenance')},['value','unit']), common('tokenRef')),
 size:one(n(0),{type:'string',pattern:'^[0-9]+(?:\\.[0-9]+)?(?:px|%|rem|em|pt|mm|cm|in|vw|vh|vmin|vmax|m)$'},en('auto','fill','hug','min-content','max-content'),common('tokenRef')),
 tokenRef:{type:'string',pattern:'^\\{[A-Za-z_][A-Za-z0-9_.-]*\\}$'},
 jsonValue:one({type:['string','number','boolean','null']},a(common('jsonValue')),map(common('jsonValue'))),
 extensions:{type:'object',description:'Only namespaced extension keys are allowed. Unknown optional extensions may be retained without interpretation.',propertyNames:{pattern:'^(?:x-[a-zA-Z0-9-]+(?:[.:/][a-zA-Z0-9_.-]+)*|[a-zA-Z][a-zA-Z0-9-]*\\.[a-zA-Z0-9_.-]+)$'},additionalProperties:common('jsonValue')},
 provenance:obj({sourceRef:common('id'),method:en('explicit','measured','extracted','inferred','generated','defaulted','platform-derived','vision-inference','reference-derived'),tool:s(),agent:s(),timestamp:{type:'string',format:'date-time'},notes:s()},['method']),
 evidence:obj({status:en('explicit','measured','extracted','inferred','generated','defaulted','platform-derived','unknown'),confidence:n(0,1),provenance:common('provenance')},['status']),
 vector2:obj({x:n(),y:n()},['x','y']),vector3:obj({x:n(),y:n(),z:n()},['x','y','z']),
 quaternion:obj({x:n(-1,1),y:n(-1,1),z:n(-1,1),w:n(-1,1)},['x','y','z','w']),
 bounds:obj({x:n(),y:n(),z:n(),width:n(0),height:n(0),depth:n(0),coordinateSpace:common('coordinateSpace')},['x','y','width','height']),
 coordinateSpace:en('absolute','normalized','local','parent','viewport','world','camera','screen','document'),
 viewport:obj({width:n(0),height:n(0),pixelRatio:{type:'number',exclusiveMinimum:0},orientation:en('portrait','landscape')},['width','height']),
 condition:obj({stateRef:common('id'),eventRef:common('id'),capability:common('taxonomy'),equals:one(s(),n(),b),not:b,all: a(common('condition'),1),any:a(common('condition'),1)},[], 'Declarative visual conditions only; no executable expressions or gameplay logic.'),
 metadata:ext({id:common('id'),title:s(),description:s(),version:s(),language:{type:'string',pattern:'^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$'},authors:a(obj({name:s(),url:common('uri'),email:{type:'string',format:'email'}},['name'])),license:s(),created:{type:'string',format:'date-time'},modified:{type:'string',format:'date-time'},tags:unique(s()),status:en('draft','review','approved','deprecated'),links:map(common('uri'))},['title'])
});
module('references','Addressable source resources, visual evidence, reference graph and conflict resolution.',{
 source:ext({id:common('id'),kind:common('taxonomy'),uri:common('uri'),title:s(),description:s(),mediaType:s(),checksum:s(),version:s(),license:s(),provenance:common('provenance')},['id','kind']),
 locator:obj({region:common('bounds'),dom:obj({cssSelector:s(),xpath:s(),text:s(),shadowPath:a(s())}),viewport:common('viewport'),figma:obj({fileKey:s(),nodeId:s(),pageId:s(),version:s()},['fileKey','nodeId']),pdf:obj({page:i(1),region:common('bounds')},['page']),presentation:obj({slide:i(1),shapeId:s()},['slide']),video:obj({start:common('time'),end:common('time'),frame:i(),track:i(),fps:{type:'number',exclusiveMinimum:0}}),scene3d:obj({scene:s(),node:s(),camera:s(),material:s()}),document:obj({section:s(),heading:s(),paragraph:i(1),bookmark:s()}),image:obj({region:common('bounds'),frame:i()}),text:obj({start:i(),end:i()})}),
 reference:ext({id:common('id'),kind:common('taxonomy'),role:en('source-of-truth','preferred','supporting','inspiration','avoid'),uri:common('uri'),sourceRef:common('id'),text:s(),locator:ref('references','locator'),aspects:unique(common('taxonomy'),1),weight:n(0,1),priority:i(),confidence:n(0,1),provenance:common('provenance'),description:s(),referenceRefs:ids()},['id','kind','role'], 'Evidence may be located externally, but validators must never fetch or execute it implicitly.'),
 binding:obj({referenceRef:common('id'),aspects:unique(common('taxonomy'),1),weight:n(0,1),priority:i()},['referenceRef']),
 referenceSet:ext({id:common('id'),title:s(),references:a(one(common('id'),ref('references','binding')),1),conflictPolicy:en('priority','first-wins','last-wins','weighted','most-specific','explicit-over-inferred','error'),aspectPriority:map(ids()),description:s()},['id','references','conflictPolicy']),
 assertion:obj({path:{type:'string',minLength:1,description:'JSON Pointer into this document.'},source:s(),sourceRef:common('id'),method:en('direct','derived','inferred','manual','generated','validated','explicit','measured','extracted','vision-inference','reference-derived','defaulted','platform-derived'),confidence:n(0,1)},['path','method'])
});
module('appearance','Color spaces, paint, typography, filters, surface and rendering appearance.',{
 color:one({type:'string',pattern:'^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$'},en('transparent','currentColor','black','white'),common('tokenRef'),obj({space:en('srgb','srgb-linear','display-p3','rec2020','lab','lch','oklab','oklch','xyz-d50','xyz-d65'),channels:{type:'array',items:n(),minItems:3,maxItems:3},alpha:n(0,1)},['space','channels'])),
 gradient:obj({type:en('linear','radial','conic'),angle:n(),center:common('vector2'),stops:a(obj({offset:n(0,1),color:ref('appearance','color')},['offset','color']),2)},['type','stops']),
 paint:one(ref('appearance','color'),obj({type:en('solid','gradient','image','pattern'),color:ref('appearance','color'),gradient:ref('appearance','gradient'),assetRef:common('id'),scale:n(0),repeat:en('none','x','y','both'),opacity:n(0,1)},['type'])),
 stroke:obj({color:ref('appearance','color'),width:common('size'),alignment:en('inside','center','outside'),dash:a(n(0)),cap:en('butt','round','square'),join:en('miter','round','bevel')},['color','width']),
 shadow:obj({color:ref('appearance','color'),x:common('dimension'),y:common('dimension'),blur:common('size'),spread:common('dimension'),inset:b},['color','x','y','blur']),
 typography:obj({fontFamily:one(s(),a(s(),1)),fontAssetRef:common('id'),fontSize:common('size'),fontWeight:one({type:'integer',minimum:1,maximum:1000},en('normal','bold')),fontStyle:en('normal','italic','oblique'),lineHeight:one(n(0),common('dimension')),letterSpacing:common('dimension'),textAlign:en('start','end','left','right','center','justify'),textTransform:en('none','uppercase','lowercase','capitalize'),textDecoration:en('none','underline','line-through','overline'),direction:en('ltr','rtl','auto'),fontFeatures:map(b),fontVariations:map(n()),maxLines:i(1),overflow:en('clip','ellipsis','wrap')}),
 filter:obj({type:en('blur','brightness','contrast','grayscale','hue-rotate','invert','saturate','sepia','custom'),amount:n(),assetRef:common('id')},['type']),
 appearance:ext({fill:one(ref('appearance','paint'),a(ref('appearance','paint'))),background:ref('appearance','paint'),color:ref('appearance','color'),stroke:one(ref('appearance','stroke'),a(ref('appearance','stroke'))),opacity:n(0,1),blend:en('normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'),radius:one(common('size'),obj({topLeft:common('size'),topRight:common('size'),bottomRight:common('size'),bottomLeft:common('size')})),shadows:a(ref('appearance','shadow')),blur:common('size'),filters:a(ref('appearance','filter')),maskRef:common('id'),clipRef:common('id'),materialRef:common('id'),textureRef:common('id'),typography:ref('appearance','typography'),visible:b})
},'appearance');
module('tokens','Typed design tokens, aliases, modes and provenance. Alias cycles require semantic validation.',{
 token:ext({type:en('color','dimension','spacing','radius','border','shadow','typography','font','gradient','opacity','duration','easing','motion','material','breakpoint','z-index','number','string'),value:one(s(),n(),b,a(common('jsonValue')),obj({color:ref('appearance','color'),width:common('size'),style:en('solid','dashed','dotted')},['color','width']),ref('appearance','typography'),ref('appearance','gradient'),ref('appearance','shadow'),ref('appearance','color'),ref('motion','spring')),description:s(),modes:map(common('jsonValue')),confidence:n(0,1),provenance:common('provenance')},['value']),
 tokenRegistry:{type:'object',propertyNames:{pattern:'^[A-Za-z_][A-Za-z0-9_.-]*$'},additionalProperties:ref('tokens','token')},
 visualLanguage:ext({personality:unique(s()),principles:unique(s()),palette:map(ref('appearance','color')),typography:map(ref('appearance','typography')),spacing:map(common('dimension')),density:en('compact','comfortable','spacious'),geometry:obj({radius:common('size'),strokeWidth:common('size'),shape:common('taxonomy')}),surface:ref('appearance','appearance'),iconography:obj({style:s(),strokeWidth:common('size'),assetRefs:ids()}),photography:obj({style:s(),referenceRefs:ids(),composition:s()}),illustration:obj({style:s(),referenceRefs:ids(),technique:s()}),motion:obj({duration:common('duration'),easing:ref('motion','easing'),reducedMotion:en('remove','reduce','substitute')}),composition:obj({principles:unique(s()),preferredLayout:common('taxonomy')}),externalTokens:a(obj({uri:common('uri'),format:en('dtcg','visualspec','custom'),namespace:s()},['uri','format']))})
},'tokenRegistry');
module('layout','Framework-independent layout, constraints, responsive rules and adaptive alternatives.',{
 insets:one(common('dimension'),obj({top:common('dimension'),right:common('dimension'),bottom:common('dimension'),left:common('dimension'),start:common('dimension'),end:common('dimension')})),
 constraint:obj({attribute:en('left','right','top','bottom','width','height','center-x','center-y','baseline','aspect-ratio'),relation:en('equal','less-than-or-equal','greater-than-or-equal'),targetRef:common('id'),targetAttribute:en('left','right','top','bottom','width','height','center-x','center-y','baseline'),constant:common('dimension'),multiplier:n(),priority:{type:'integer',minimum:0,maximum:1000}},['attribute','relation']),
 layout:ext({type:en('stack','row','column','grid','overlay','flow','absolute','constraint-based'),width:common('size'),height:common('size'),minWidth:common('size'),maxWidth:common('size'),minHeight:common('size'),maxHeight:common('size'),gap:common('dimension'),rowGap:common('dimension'),columnGap:common('dimension'),padding:ref('layout','insets'),margin:ref('layout','insets'),align:en('start','end','center','stretch','baseline'),justify:en('start','end','center','space-between','space-around','space-evenly'),alignSelf:en('auto','start','end','center','stretch','baseline'),wrap:en('none','wrap','reverse'),columns:one(i(1),a(common('size'),1)),rows:one(i(1),a(common('size'),1)),column:i(1),row:i(1),columnSpan:i(1),rowSpan:i(1),grow:n(0),shrink:n(0),basis:common('size'),aspectRatio:{type:'number',exclusiveMinimum:0},position:en('flow','relative','absolute','fixed','sticky'),inset:ref('layout','insets'),zIndex:{type:'integer'},clip:b,overflow:en('visible','hidden','clip','scroll','auto'),scroll:obj({axis:en('x','y','both'),snap:en('none','mandatory','proximity'),snapAlign:en('start','center','end'),overscroll:en('auto','contain','none')}),constraints:a(ref('layout','constraint')),safeArea:b,direction:en('ltr','rtl')}),
 query:obj({minWidth:n(0),maxWidth:n(0),minHeight:n(0),maxHeight:n(0),orientation:en('portrait','landscape'),minAspectRatio:n(0),maxAspectRatio:n(0),pixelDensity:n(0),inputModality:en('pointer','touch','keyboard','voice','gamepad','spatial'),windowClass:en('compact','medium','expanded'),platform:common('taxonomy'),capabilities:unique(common('taxonomy')),containerRef:common('id'),safeArea:b}),
 responsive:obj({strategy:en('responsive','adaptive'),rules:a(obj({when:ref('layout','query'),layout:ref('layout','layout'),appearance:ref('appearance','appearance'),variant:s(),visible:b,componentRef:common('id'),priority:{type:'integer',minimum:0,maximum:1000}},['when']),1)},['strategy','rules'])
},'layout');
module('geometry','2D and 3D primitives, paths, transforms and coordinate conventions.',{
 geometry:ext({type:en('rectangle','rounded-rectangle','ellipse','circle','line','polygon','polyline','path','text','plane','box','sphere','cylinder','cone','torus','mesh','custom'),bounds:common('bounds'),width:common('size'),height:common('size'),depth:common('size'),radius:common('size'),path:s('SVG-compatible path data.'),points:a(one(common('vector2'),common('vector3')),2),closed:b,assetRef:common('id'),segments:i(3),text:s()},['type']),
 transformOp:obj({type:en('translate','scale','rotate','skew','perspective'),x:n(),y:n(),z:n(),angle:n()},['type'],'One step in an ordered transform list. Order is significant.'),
 transform:one(obj({translate:one(common('vector2'),common('vector3')),rotate:one(n(),common('vector3'),common('quaternion')),scale:one(n(),common('vector2'),common('vector3')),origin:one(common('vector2'),common('vector3')),matrix:{type:'array',items:n(),anyOf:[{minItems:6,maxItems:6},{minItems:16,maxItems:16}]},operations:a(ref('geometry','transformOp'),1),coordinateSpace:common('coordinateSpace')}),a(ref('geometry','transformOp'),1))
},'geometry');
module('accessibility','Cross-platform semantic accessibility contract, with explicit native-first ARIA mappings.',{
 name:one(s(),obj({source:en('content','literal','reference','derived'),value:s(),targetRef:common('id'),required:b},['source'])),
 focus:obj({strategy:en('natural','roving','active-descendant','programmatic','none'),trap:b,restoreOnClose:b,restore:b,initial:s(),order:ids(),activation:en('automatic','manual'),visible:b}),
 relationships:obj({controls:one(common('id'),ids()),describedBy:one(common('id'),ids()),details:one(common('id'),ids()),flowTo:one(common('id'),ids()),labelledBy:one(common('id'),ids()),owns:one(common('id'),ids()),activeDescendant:common('id')}),
 accessibility:ext({semanticRole:common('taxonomy'),role:common('taxonomy'),name:ref('accessibility','name'),description:one(s(),ref('accessibility','name')),labelRequired:b,decorative:b,hidden:b,states:obj({checked:one(b,en('mixed')),disabled:b,expanded:b,hidden:b,invalid:one(b,en('grammar','spelling')),pressed:one(b,en('mixed')),selected:b,busy:b}),properties:obj({autocomplete:en('none','inline','list','both'),hasPopup:one(b,common('taxonomy')),level:i(1),multiline:b,orientation:en('horizontal','vertical'),placeholder:s(),readonly:b,required:b,valueMin:n(),valueMax:n(),valueNow:n(),valueText:s(),selectionMode:en('none','single','multiple')}),relationships:ref('accessibility','relationships'),focus:ref('accessibility','focus'),keyboard:map(unique(s(),1)),inputModalities:unique(en('keyboard','pointer','touch','voice','switch','gamepad','spatial')),readingOrder:ids(),live:obj({politeness:en('off','polite','assertive'),atomic:b,relevant:unique(en('additions','removals','text','all'))}),textScaling:obj({enabled:b,min:n(0),max:n(0)}),contrast:obj({minimumRatio:n(1,21),highContrast:b}),reducedMotion:en('respect','remove','reduce','substitute'),targetSize:obj({width:n(0),height:n(0)},['width','height']),aria:obj({preferNative:b,htmlElement:s(),role:common('taxonomy'),attributes:{type:'object',propertyNames:{pattern:'^aria-[a-z]+(?:-[a-z]+)*$'},additionalProperties:one(s(),b,n())}}),platformMappings:map(obj({role:s(),label:s(),traits:unique(s()),properties:map(one(s(),b,n()))})),motionPolicy:obj({respectSystemPreference:b,requireReducedAlternative:b,essentialMotionRequiresJustification:b}),conformance:en('WCAG-2.2-A','WCAG-2.2-AA','WCAG-2.2-AAA')})
},'accessibility');
module('components','Component definitions and instances, anatomy, variants, behavior and existing design-system mappings.',{
 mapping:obj({component:s(),package:s(),version:s(),variant:s(),primitive:s(),pattern:s(),props:map(common('jsonValue'))}),
 behavior:obj({overlay:b,modal:b,modality:en('modal','non-modal'),placement:s(),dismiss:one(unique(en('escape','backdrop','swipe','outside-press','close-button')),obj({outsidePress:b,escape:b,backdrop:b,swipe:b})),focus:ref('accessibility','focus'),anchor:obj({targetRef:common('id'),target:s(),placement:en('top','bottom','left','right','top-start','top-end','bottom-start','bottom-end','left-start','left-end','right-start','right-end'),collision:en('flip','shift','none'),offset:common('dimension')}),selection:en('none','single','multiple'),orientation:en('horizontal','vertical'),activation:en('automatic','manual'),scrollLock:b,loop:b}),
 slot:obj({description:s(),semanticRole:common('taxonomy'),required:b,multiple:b,allowedKinds:unique(common('taxonomy')),componentRef:common('id'),states:unique(s()),accessibility:ref('accessibility','accessibility')}),
 composition:obj({slot:s(),componentRef:common('id'),nodeRef:common('id'),properties:map(common('jsonValue'))},['slot']),
 component:ext({id:common('id'),kind:common('taxonomy'),componentRef:common('id'),name:s(),description:s(),family:s(),variant:s(),variants:map(obj({description:s(),appearance:ref('appearance','appearance'),layout:ref('layout','layout'),properties:map(common('jsonValue'))})),anatomy:obj({slots:map(ref('components','slot'))},['slots']),properties:map(common('jsonValue')),children:a(ref('components','composition')),states:unique(s()),behavior:ref('components','behavior'),layout:ref('layout','layout'),appearance:ref('appearance','appearance'),accessibility:ref('accessibility','accessibility'),responsive:ref('layout','responsive'),motion:map(common('id')),eventRefs:ids(),stateRefs:ids(),actionRefs:ids(),references:ids(),implementationMapping:ref('components','mapping'),platformMappings:map(ref('components','mapping'))},['id'])
},'component').$defs.component.anyOf=[{required:['kind']},{required:['componentRef']}];
module('semantics','A semantic tree independently describes meaning, roles and reading relationships.',{
 semanticNode:ext({id:common('id'),role:common('taxonomy'),name:ref('accessibility','name'),nodeRef:common('id'),entityRef:common('id'),componentRef:common('id'),accessibility:ref('accessibility','accessibility'),children:a(ref('semantics','semanticNode')),relationshipRefs:ids()},['id','role'])
},'semanticNode');
module('interaction','Observable events, declarative visual actions and visual state graphs. No executable business logic.',{
 event:ext({id:common('id'),type:common('taxonomy'),targetRef:common('id'),key:s(),modifiers:unique(en('alt','ctrl','meta','shift')),pointer:en('mouse','touch','pen','any'),gesture:obj({type:en('drag','swipe','pinch','rotate','long-press','tap'),axis:en('x','y','both'),threshold:n(0),direction:en('up','down','left','right','any')}),markerRef:common('id'),externalName:s(),actionRefs:ids(),once:b,debounce:common('duration')},['id','type']),
 action:ext({id:common('id'),verb:common('taxonomy'),targetRef:common('id'),targetRefs:ids(),intent:s(),eventRef:common('id'),stateRef:common('id'),motionRef:common('id'),parameters:obj({value:one(s(),n(),b,common('vector2'),common('vector3')),position:one(common('vector2'),common('vector3')),angle:n(),scale:n(),time:common('time'),destination:common('id'),materialRef:common('id'),duration:common('duration'),property:s(),visible:b}),composition:en('sequence','parallel','conditional','stagger'),actionRefs:ids(),condition:common('condition'),delay:common('duration'),stagger:common('duration'),onComplete:ids(),onCancel:ids()},['id','verb']),
 state:ext({id:common('id'),name:s(),targetRef:common('id'),initial:b,appearance:ref('appearance','appearance'),layout:ref('layout','layout'),visible:b,variant:s(),motionRef:common('id'),accessibility:ref('accessibility','accessibility'),onEnter:ids(),onExit:ids(),transitions:a(obj({to:common('id'),eventRef:common('id'),actionRef:common('id'),motionRef:common('id'),condition:common('condition')},['to']))},['id','name']),
 flow:ext({id:common('id'),name:s(),initial:common('id'),sceneRef:common('id'),states:a(obj({id:common('id'),name:s(),sceneRef:common('id')},['id','name']),1),transitions:a(obj({from:common('id'),to:common('id'),eventRef:common('id'),motionRef:common('id'),condition:common('condition')},['from','to']))},['id','initial','states'])
});
module('motion','Temporal visual changes including keyframes, springs, paths, shared elements and driven progress.',{
 value:one(n(),s(),b,common('vector2'),common('vector3'),ref('appearance','color')),
 easing:one(en('linear','ease','ease-in','ease-out','ease-in-out'),obj({type:{const:'cubic-bezier'},values:{type:'array',items:n(),minItems:4,maxItems:4}},['type','values']),obj({type:{const:'cubic-bezier'},x1:n(0,1),y1:n(),x2:n(0,1),y2:n()},['type','x1','y1','x2','y2']),obj({type:{const:'linear'},points:{type:'array',items:n(),minItems:2}},['type','points']),obj({type:{const:'steps'},count:i(1),position:en('start','end','jump-start','jump-end','jump-none','jump-both')},['type','count']),obj({type:{const:'spring'},mass:{type:'number',exclusiveMinimum:0},stiffness:{type:'number',exclusiveMinimum:0},damping:n(0),initialVelocity:n()},['type','mass','stiffness','damping'])),
 spring:obj({mass:{type:'number',exclusiveMinimum:0},stiffness:{type:'number',exclusiveMinimum:0},damping:n(0),initialVelocity:n(),restSpeed:n(0),restDelta:n(0)},['mass','stiffness','damping']),
 keyframe:obj({offset:n(0,1),value:ref('motion','value'),values:map(ref('motion','value')),easing:ref('motion','easing'),composite:en('replace','add','accumulate')},['offset']),
 step:obj({type:en('animation','sequence','parallel','stagger','wait'),motionRef:common('id'),each:common('duration'),from:en('first','last','center'),seed:i(),duration:common('duration'),targets:ids(),children:a(ref('motion','step'))},['type']),
 track:obj({property:s('Animatable visual property path, for example appearance.opacity or transform.translate.'),from:ref('motion','value'),to:ref('motion','value'),keyframes:a(ref('motion','keyframe'),2),easing:ref('motion','easing'),composite:en('replace','add','accumulate')},['property']),
 driver:obj({type:en('event','state-transition','gesture','scroll','timeline','viewport','visibility','media-playback','external-progress'),sourceRef:common('id'),axis:en('x','y','both'),range:obj({start:n(),end:n()},['start','end']),clamp:b,externalName:s()},['type']),
 path:obj({data:s(),pathRef:common('id'),orientation:en('auto','auto-reverse','fixed'),start:n(0,1),end:n(0,1),coordinateSpace:common('coordinateSpace')}),
 sharedElement:obj({entityRef:common('id'),fromNodeRef:common('id'),toNodeRef:common('id'),preserve:unique(en('position','size','shape','opacity','color','content')),crossfade:b},['entityRef','fromNodeRef','toNodeRef']),
 animation:ext({id:common('id'),name:s(),kind:en('property','spring','decay','path','morph','layout','shared-element','sequence','parallel','stagger','transition'),targets:ids(),tracks:a(ref('motion','track'),1),duration:common('duration'),delay:common('delay'),easing:ref('motion','easing'),spring:ref('motion','spring'),decay:obj({velocity:n(),deceleration:{type:'number',exclusiveMinimum:0}},['velocity','deceleration']),timing:obj({duration:common('duration'),delay:common('delay'),endDelay:common('duration'),iterations:one(n(0),{const:'infinite'}),iterationStart:n(0),direction:en('normal','reverse','alternate','alternate-reverse'),fill:en('none','forwards','backwards','both'),playbackRate:{type:'number',exclusiveMinimum:0}}),iterations:one(n(0),{const:'infinite'}),direction:en('normal','reverse','alternate','alternate-reverse'),autoreverse:b,fill:en('none','forwards','backwards','both'),composition:en('replace','add','accumulate'),motionRefs:ids(),children:a(ref('motion','step')),stagger:common('duration'),trigger:ref('motion','driver'),path:ref('motion','path'),morph:obj({fromPath:s(),toPath:s(),preserveTopology:b},['fromPath','toPath']),sharedElement:ref('motion','sharedElement'),essential:b,interrupt:one(en('cancel','finish','reverse','retarget','blend','queue','ignore'),obj({policy:en('cancel','finish','reverse','retarget','blend','queue','ignore'),preserveVelocity:b},['policy'])),cancel:en('restore','freeze','finish'),reducedMotion:obj({strategy:en('instant','fade','reduce','substitute','none','disable','replace','shorten'),duration:common('duration'),motionRef:common('id')}),performance:obj({preferCompositor:b,frameBudget:n(0)})},['id'])
},'animation');
module('timeline','Tracks, clips, markers, editorial transitions and audio-visual synchronization.',{
 transition:obj({type:common('taxonomy'),duration:common('duration'),easing:ref('motion','easing'),motionRef:common('id')},['type','duration']),
 clip:ext({id:common('id'),start:common('time'),duration:common('duration'),sourceIn:common('time'),sourceOut:common('time'),sceneRef:common('id'),assetRef:common('id'),entityRef:common('id'),motionRef:common('id'),actionRef:common('id'),cameraRef:common('id'),lightRef:common('id'),effectRef:common('id'),speed:{type:'number',exclusiveMinimum:0},timeRemapping:a(obj({time:common('time'),sourceTime:common('time')},['time','sourceTime']),2),transitionIn:ref('timeline','transition'),transitionOut:ref('timeline','transition'),volume:n(0),muted:b},['id','start','duration']),
 track:ext({id:common('id'),type:en('visual','video','audio','motion','action','camera','lighting','entity','effect','caption','subtitle'),name:s(),clips:a(ref('timeline','clip')),muted:b,locked:b,layer:{type:'integer'}},['id','type','clips']),
 marker:obj({id:common('id'),time:common('time'),label:s(),actionRefs:ids()},['id','time']),
 timeline:ext({id:common('id'),name:s(),duration:common('duration'),fps:{type:'number',exclusiveMinimum:0},tracks:a(ref('timeline','track')),markers:a(ref('timeline','marker')),loop:b,synchronization:a(obj({sourceRef:common('id'),targetRef:common('id'),mode:en('beat','cue','dialogue','timecode','marker'),offset:common('time')},['sourceRef','targetRef','mode']))},['id','duration','tracks'])
},'timeline');
module('assets','Resources used in the output, distinct from references that specify expected appearance.',{
 asset:ext({id:common('id'),type:en('image','video','audio','font','svg','vector','raster','icon','lottie','model','texture','shader','document','animation','data'),uri:common('uri'),mediaType:s(),name:s(),description:s(),width:i(1),height:i(1),duration:common('duration'),byteLength:i(),checksum:s(),license:s(),attribution:s(),colorSpace:en('srgb','display-p3','rec2020','linear','unknown'),variants:a(obj({uri:common('uri'),width:i(1),height:i(1),mediaType:s(),quality:n(0,1),platform:common('taxonomy')},['uri'])),fallbackRef:common('id'),font:obj({family:s(),style:en('normal','italic','oblique'),weight:one(i(1),obj({min:i(1),max:i(1)},['min','max'])),axes:map(obj({min:n(),max:n(),default:n()},['min','max','default']))}),integrity:s()},['id','type','uri'])
},'asset');
module('camera','Photographic and realtime cameras with shared optical and composition intent.',{
 camera:ext({id:common('id'),type:en('perspective','orthographic','panoramic','photographic','realtime'),position:common('vector3'),orientation:one(common('vector3'),common('quaternion')),targetRef:common('id'),fieldOfView:{type:'number',exclusiveMinimum:0,exclusiveMaximum:180},focalLength:{type:'number',exclusiveMinimum:0},sensorWidth:{type:'number',exclusiveMinimum:0},aperture:{type:'number',exclusiveMinimum:0},near:n(0),far:{type:'number',exclusiveMinimum:0},orthographicSize:{type:'number',exclusiveMinimum:0},focus:obj({targetRef:common('id'),distance:n(0),mode:en('manual','auto','follow')}),depthOfField:obj({enabled:b,focusDistance:n(0),blur:n(0)}),framing:en('extreme-close-up','close-up','medium','medium-wide','wide','extreme-wide','establishing','over-shoulder','point-of-view','custom'),shotType:common('taxonomy'),movement:unique(common('taxonomy')),intent:s(),actionRefs:ids(),exposure:n(),whiteBalance:n(0)},['id','type'])
},'camera');
module('lighting','Physical and intent-oriented lights, environment illumination and shadows.',{
 light:ext({id:common('id'),type:en('directional','point','spot','area','environment','natural'),color:ref('appearance','color'),intensity:n(0),intensityUnit:en('normalized','lux','lumens','candela','watts'),temperature:n(0),position:common('vector3'),direction:common('vector3'),targetRef:common('id'),softness:n(0,1),falloff:en('none','linear','inverse-square'),range:n(0),coneAngle:n(0,180),size:common('vector2'),shadow:obj({enabled:b,bias:n(),softness:n(0,1),resolution:i(1)}),assetRef:common('id'),role:en('key','fill','rim','background','ambient','practical')},['id','type'])
},'light');
module('materials','Interoperable material intent, texture bindings and physically based surface parameters.',{
 texture:obj({assetRef:common('id'),channel:en('r','g','b','a','rgb','rgba'),coordinateSet:i(),scale:common('vector2'),offset:common('vector2'),rotation:n(),wrap:en('repeat','clamp','mirror'),filter:en('nearest','linear','anisotropic'),strength:n(0)},['assetRef']),
 material:ext({id:common('id'),name:s(),model:en('pbr-metallic-roughness','pbr-specular-glossiness','unlit','toon','custom'),baseColor:ref('appearance','color'),metalness:n(0,1),roughness:n(0,1),normal:ref('materials','texture'),emissive:ref('appearance','color'),emissiveIntensity:n(0),opacity:n(0,1),transmission:n(0,1),ior:{type:'number',minimum:1},clearCoat:n(0,1),clearCoatRoughness:n(0,1),doubleSided:b,alphaMode:en('opaque','mask','blend'),alphaCutoff:n(0,1),textures:map(ref('materials','texture')),assetRef:common('id')},['id','model'])
},'material');
module('effects','Reusable visual effects, particle systems and post-processing intent.',{
 effect:ext({id:common('id'),type:common('taxonomy'),targetRefs:ids(),enabled:b,assetRef:common('id'),duration:common('duration'),blend:en('normal','add','multiply','screen'),particles:obj({count:i(),rate:n(0),lifetime:common('duration'),size:common('size'),velocity:common('vector3'),spread:n(0),color:ref('appearance','color'),seed:i()}),trail:obj({length:n(0),width:common('size'),color:ref('appearance','color')}),postProcessing:obj({exposure:n(),contrast:n(0),saturation:n(0),temperature:n(),tint:n(),bloom:n(0),vignette:n(0,1),grain:n(0,1),chromaticAberration:n(0,1),lutAssetRef:common('id'),toneMapping:en('none','linear','reinhard','aces','filmic')}),shaderAssetRef:common('id'),parameters:map(one(s(),n(),b,common('vector2'),common('vector3'),ref('appearance','color')))},['id','type'])
},'effect');
module('world','Visual world, environments, identities, representations, lifecycle and semantic relationships.',{
 environment:ext({id:common('id'),kind:common('taxonomy'),foreground:ids(),midground:ids(),background:ids(),sky:obj({color:ref('appearance','color'),assetRef:common('id'),type:en('solid','gradient','image','procedural')}),terrain:obj({entityRef:common('id'),assetRef:common('id'),elevation:n()}),weather:common('taxonomy'),timeOfDay:one(en('dawn','morning','noon','afternoon','dusk','night'),{type:'string',pattern:'^(?:[01][0-9]|2[0-3]):[0-5][0-9]$'}),season:en('spring','summer','autumn','winter'),temperature:n(),fog:obj({density:n(0),color:ref('appearance','color'),near:n(0),far:n(0)}),haze:n(0,1),lightRefs:ids(),effectRefs:ids(),entityRefs:ids()},['kind']),
 representation:ext({id:common('id'),type:en('image','video','vector','3d','illustration','generated','ui','text','procedural'),assetRef:common('id'),nodeRef:common('id'),componentRef:common('id'),sceneRef:common('id'),variant:s(),condition:common('condition'),levelOfDetail:i(),referenceRefs:ids()},['type']),
 entity:ext({id:common('id'),kind:common('taxonomy'),name:s(),role:common('taxonomy'),geometry:ref('geometry','geometry'),transform:ref('geometry','transform'),appearance:ref('appearance','appearance'),representation:ref('world','representation'),representations:a(ref('world','representation'),1),visibility:obj({visible:b,occluded:b,opacity:n(0,1),layers:unique(s())}),presence:obj({...timed,condition:common('condition'),sceneRefs:ids()}),lifecycle:en('persistent','ephemeral','generated','derived','conditional','tracked','procedural'),parts:ids(),relationships:ids(),states:ids(),actions:ids(),motion:ids(),references:ids(),identity:obj({persistentKey:s(),label:s(),description:s()}),confidence:n(0,1),provenance:common('provenance')},['id','kind']),
 relationship:ext({id:common('id'),type:common('taxonomy'),sourceRef:common('id'),targetRef:common('id'),strength:n(0,1),temporal:obj(timed),confidence:n(0,1),provenance:common('provenance')},['id','type','sourceRef','targetRef']),
 world:ext({id:common('id'),name:s(),environment:ref('world','environment'),sceneRefs:ids(),entityRefs:ids(),cameraRefs:ids(),lightRefs:ids(),effectRefs:ids(),coordinateSystem:obj({handedness:en('left','right'),upAxis:en('x','y','z'),unit:en('px','m','cm','mm'),origin:common('vector3')})})
});
module('scene','Renderable scene tree and its semantic, entity and component bindings.',{
 content:obj({text:s(),assetRef:common('id'),alt:s(),runs:a(obj({text:{type:'string'},typography:ref('appearance','typography'),color:ref('appearance','color')},['text'])),fit:en('contain','cover','fill','none','scale-down'),objectPosition:common('vector2'),chart:ref('media','chart')}),
 node:ext({id:common('id'),kind:common('taxonomy'),name:s(),entityRef:common('id'),componentRef:common('id'),semanticRef:common('id'),assetRef:common('id'),materialRef:common('id'),instanceOf:common('id'),text:{type:'string'},content:ref('scene','content'),geometry:ref('geometry','geometry'),layout:ref('layout','layout'),appearance:ref('appearance','appearance'),transform:ref('geometry','transform'),bounds:common('bounds'),responsive:ref('layout','responsive'),accessibility:ref('accessibility','accessibility'),children:a(ref('scene','node')),visible:b,layer:s(),stateRefs:ids(),eventRefs:ids(),actionRefs:ids(),motionRefs:ids(),effectRefs:ids(),references:ids(),spatialUI:ref('game','spatialUI')},['id','kind']),
 scene:ext({id:common('id'),name:s(),kind:en('2d','2.5d','3d'),nodes:a(ref('scene','node')),entityRefs:ids(),cameraRef:common('id'),lightRefs:ids(),layers:a(obj({id:common('id'),name:s(),order:{type:'integer'},visible:b,opacity:n(0,1)},['id'])),environment:ref('world','environment'),effects:ids(),overlays:ids(),viewport:common('viewport'),background:ref('appearance','paint'),coordinateSpace:common('coordinateSpace'),timelineRef:common('id'),layout:ref('layout','layout')},['id','kind','nodes'])
},'scene');
module('media','Image composition, illustration, audiovisual projects, captions and data visualization.',{
 composition:ext({id:common('id'),sceneRef:common('id'),cameraRef:common('id'),subjectRefs:ids(),intent:s(),style:s(),rules:unique(en('rule-of-thirds','golden-ratio','symmetry','leading-lines','centered','diagonal','radial','free')),subjectPlacement:a(obj({entityRef:common('id'),bounds:common('bounds'),priority:i()},['entityRef','bounds'])),negativeSpace:a(common('bounds')),balance:en('symmetric','asymmetric','radial'),depth:en('flat','layered','deep'),lightRefs:ids(),effectRefs:ids(),referenceRefs:ids()},['id','sceneRef']),
 illustration:ext({id:common('id'),sceneRef:common('id'),technique:common('taxonomy'),style:s(),palette:a(ref('appearance','color')),stroke:ref('appearance','stroke'),textureAssetRefs:ids(),referenceRefs:ids()},['id','sceneRef','technique']),
 caption:obj({id:common('id'),start:common('time'),end:common('time'),text:s(),speaker:s(),language:s(),position:en('top','bottom','center'),nodeRef:common('id')},['id','start','end','text']),
 shot:obj({id:common('id'),sceneRef:common('id'),cameraRef:common('id'),start:common('time'),duration:common('duration'),intent:s(),transition:ref('timeline','transition')},['id','sceneRef','start','duration']),
 video:ext({id:common('id'),timelineRef:common('id'),shots:a(ref('media','shot'),1),captions:a(ref('media','caption')),subtitleAssetRef:common('id'),audioAssetRefs:ids(),effectRefs:ids(),aspectRatio:{type:'number',exclusiveMinimum:0}},['id','timelineRef','shots']),
 chart:obj({type:en('bar','line','area','pie','donut','scatter','table'),title:s(),description:s(),labels:a(s()),series:a(obj({name:s(),values:a(one(n(),{type:'null'})),color:ref('appearance','color')},['name','values']),1),xLabel:s(),yLabel:s(),legend:b,showValues:b},['type','series'])
});
module('presentation','Slides, masters, narrative sequence, presenter notes and per-slide timelines.',{
 master:ext({id:common('id'),name:s(),sceneRef:common('id'),layout:ref('layout','layout'),background:ref('appearance','paint'),slots:map(ref('components','slot')),headerNodeRef:common('id'),footerNodeRef:common('id')},['id']),
 slide:ext({id:common('id'),title:s(),sceneRef:common('id'),masterRef:common('id'),layout:s(),notes:{type:'string'},transition:ref('timeline','transition'),timelineRef:common('id'),duration:common('duration'),hidden:b,mediaAssetRefs:ids(),narrativeRole:common('taxonomy')},['id','sceneRef']),
 presentation:ext({id:common('id'),title:s(),size:common('viewport'),masters:a(ref('presentation','master')),slides:a(ref('presentation','slide'),1),sequence:ids(),loop:b},['id','slides'])
},'presentation');
module('document','Editorial and paginated visual layout, page sections, figures, notes and pagination.',{
 section:obj({id:common('id'),title:s(),nodeRefs:ids(),columns:i(1),columnGap:common('dimension'),breakBefore:en('auto','page','column','odd','even'),keepTogether:b},['id']),
 note:obj({id:common('id'),anchorRef:common('id'),text:s(),kind:en('footnote','endnote','caption'),nodeRef:common('id')},['id','text','kind']),
 page:ext({id:common('id'),sceneRef:common('id'),size:obj({width:common('size'),height:common('size')},['width','height']),margin:ref('layout','insets'),bleed:common('size'),headerRef:common('id'),footerRef:common('id'),sections:a(ref('document','section')),notes:a(ref('document','note')),number:i(1)},['id','sceneRef']),
 document:ext({id:common('id'),title:s(),pages:a(ref('document','page'),1),pagination:obj({start:i(),format:en('decimal','lower-roman','upper-roman','lower-alpha','upper-alpha'),position:en('header','footer','margin'),showFirst:b}),binding:en('left','right','top','none'),widows:i(1),orphans:i(1)},['id','pages'])
},'document');
module('three-d','3D scene intent, geometry instances, LOD, skeletons, skins, rigs and morph targets.',{
 joint:obj({id:common('id'),name:s(),parentRef:common('id'),transform:ref('geometry','transform'),inverseBindMatrix:{type:'array',items:n(),minItems:16,maxItems:16}},['id']),
 skeleton:ext({id:common('id'),joints:a(ref('three-d','joint'),1),rootRef:common('id')},['id','joints']),
 mesh:ext({id:common('id'),assetRef:common('id'),geometry:ref('geometry','geometry'),materialRefs:ids(),skeletonRef:common('id'),skin:obj({jointRefs:ids(),weightsAssetRef:common('id'),bindPoseAssetRef:common('id')}),morphTargets:a(obj({id:common('id'),name:s(),assetRef:common('id'),weight:n(0,1)},['id'])),lod:a(obj({distance:n(0),assetRef:common('id'),meshRef:common('id'),screenCoverage:n(0,1)},['distance'])),instanceRefs:ids()},['id']),
 rig:ext({id:common('id'),skeletonRef:common('id'),assetRef:common('id'),controls:a(obj({id:common('id'),jointRefs:ids(),kind:en('fk','ik','look-at','constraint'),targetRef:common('id')},['id','kind']))},['id']),
 threeD:ext({sceneRefs:ids(),meshes:a(ref('three-d','mesh')),skeletons:a(ref('three-d','skeleton')),rigs:a(ref('three-d','rig')),assetRefs:ids(),animationRefs:ids()})
},'threeD');
module('game','Visual-only game profile: levels, HUD, characters, animation controllers, spatial UI and cutscenes.',{
 spatialUI:obj({mode:en('world-space','screen-space','anchored','entity-attached'),anchorRef:common('id'),billboard:en('none','camera','axis-y'),occlusion:en('depth-test','always-visible','fade'),scaleMode:en('world','screen','distance'),interaction:en('pointer','gaze','ray','direct','none'),distance:n(0)},['mode']),
 character:ext({id:common('id'),entityRef:common('id'),rigRef:common('id'),skeletonRef:common('id'),animationController:obj({initialState:common('id'),states:a(obj({id:common('id'),name:s(),motionRef:common('id'),assetRef:common('id'),speed:n(0),loop:b},['id','name'])),transitions:a(obj({from:common('id'),to:common('id'),duration:common('duration'),blend:en('linear','crossfade','additive'),eventRef:common('id')},['from','to']))}),visualStateMappings:map(obj({stateRef:common('id'),motionRef:common('id'),effectRefs:ids(),appearance:ref('appearance','appearance')}))},['id','entityRef']),
 level:ext({id:common('id'),name:s(),sceneRefs:ids(),areas:a(obj({id:common('id'),sceneRef:common('id'),bounds:common('bounds'),environment:ref('world','environment')},['id'])),environment:ref('world','environment')},['id','sceneRefs']),
 game:ext({worldRef:common('id'),levels:a(ref('game','level')),characters:a(ref('game','character')),hud:obj({sceneRef:common('id'),componentRefs:ids(),safeArea:b}),cameraRef:common('id'),visualStates:a(obj({id:common('id'),externalName:s(),stateRefs:ids(),actionRefs:ids(),effectRefs:ids()},['id','externalName'])),cutscenes:a(obj({id:common('id'),timelineRef:common('id'),skippable:b,restoreCamera:b},['id','timelineRef'])),spatialUI:a(ref('game','spatialUI'))})
},'game');
module('rendering','Output requirements, capability negotiation, explicit fallbacks and platform overrides.',{
 capability:obj({name:common('taxonomy'),level:en('required','preferred','optional','unsupported'),fallback:obj({strategy:en('omit','approximate','substitute','rasterize','flatten'),description:s(),assetRef:common('id'),motionRef:common('id'),capability:common('taxonomy')}),reason:s()},['name','level']),
 target:ext({id:common('id'),platform:common('taxonomy'),width:i(1),height:i(1),pixelDensity:{type:'number',exclusiveMinimum:0},colorSpace:en('srgb','display-p3','rec2020','linear'),colorSpaceFallback:en('srgb','display-p3','rec2020','linear'),frameRate:{type:'number',exclusiveMinimum:0},aspectRatio:{type:'number',exclusiveMinimum:0},quality:en('draft','preview','production','lossless'),format:s(),capabilities:a(ref('rendering','capability')),profileRefs:unique(common('taxonomy')),transparent:b},['id','platform']),
 rendering:ext({targets:a(ref('rendering','target'),1),capabilities:a(ref('rendering','capability')),quality:en('draft','preview','production','lossless'),deterministic:b,seed:i(),fallbackPolicy:en('explicit-only','report-and-approximate','error'),background:ref('appearance','color')}),
 override:ext({platform:common('taxonomy'),targetRef:common('id'),reason:s(),layout:ref('layout','layout'),appearance:ref('appearance','appearance'),accessibility:ref('accessibility','accessibility'),componentRef:common('id'),motionRef:common('id'),capabilities:a(ref('rendering','capability'))},['platform','targetRef','reason'])
},'rendering');
module('validation','Structural, semantic, accessibility, visual and reference conformance expectations.',{
 tolerance:obj({absolute:n(0),relative:n(0,1),unit:s()},[], 'Comparison thresholds; metric-specific interpretation is declared by the validator.'),
 rule:ext({id:common('id'),type:en('schema','semantic','capability','accessibility','visual','reference-conformance'),targetRef:common('id'),referenceRef:common('id'),aspect:common('taxonomy'),metric:common('taxonomy'),matchMode:en('exact','structural','perceptual','semantic','stylistic','inspirational'),conformance:en('strict','approximate','inspiration'),tolerance:ref('validation','tolerance'),severity:en('error','warning','info'),required:b,description:s(),viewport:common('viewport'),stateRef:common('id'),time:common('time')},['id','type']),
 validation:ext({schema:b,semantic:b,accessibility:b,capabilities:b,rules:a(ref('validation','rule')),referenceConformance:a(obj({referenceRef:common('id'),aspect:common('taxonomy'),conformance:en('strict','approximate','inspiration'),matchMode:en('exact','structural','perceptual','semantic','stylistic','inspirational'),tolerance:ref('validation','tolerance')},['referenceRef','aspect','conformance'])),failOn:en('error','warning','info')})
},'validation');
// Reference matching is shared by references and conformance rules.
Object.assign(schemas.get('modules/references.schema.json').$defs.reference.properties,{matchMode:en('exact','structural','perceptual','semantic','stylistic','inspirational'),conformance:map(en('strict','approximate','inspiration')),tolerance:ref('validation','tolerance')});
schemas.get('modules/motion.schema.json').$defs.keyframe.anyOf=[{required:['value']},{required:['values']}];
const tokenDef=schemas.get('modules/tokens.schema.json').$defs.token;
tokenDef.properties.$type=tokenDef.properties.type;
tokenDef.properties.$value=tokenDef.properties.value;
tokenDef.required=(tokenDef.required||[]).filter((key)=>key!=='value');
tokenDef.anyOf=[{required:['value']},{required:['$value']}];

const profiles = ['ui','image','illustration','document','presentation','video','motion-graphics','3d','game'];
const profileRequirements = {
  ui: ['scenes'],
  image: ['entities','scenes','cameras'],
  illustration: ['illustrations','entities'],
  document: ['documents'],
  presentation: ['presentations'],
  video: ['videos','timelines'],
  'motion-graphics': ['motion','scenes'],
  '3d': ['threeD','scenes','entities'],
  game: ['game']
};
const arrayProperties = new Set(['scenes','entities','cameras','illustrations','documents','presentations','videos','timelines','motion','components','lights','materials']);

const root = {
  $schema: dialect,
  $id: `${base}schema.json`,
  title: 'Visual Spec 1.0',
  description: 'Framework-independent contract for visual intent: what exists, what it means, how it appears, how it behaves, how it changes, and which evidence defines the expected result.',
  type: 'object',
  additionalProperties: false,
  required: ['visualSpec','metadata','profiles'],
  properties: {
    $schema: {const: `${base}schema.json`},
    visualSpec: {const: '1.0'},
    metadata: common('metadata'),
    profiles: {type:'array', minItems:1, uniqueItems:true, items:{enum:profiles}, description:'One or more combinable visual profiles.'},
    sources: a(ref('references','source')),
    visualReferences: a(ref('references','reference')),
    visualReferenceSets: a(ref('references','referenceSet')),
    visualLanguage: ref('tokens','visualLanguage'),
    tokens: ref('tokens','tokenRegistry'),
    world: ref('world','world'),
    entities: a(ref('world','entity')),
    relationships: a(ref('world','relationship')),
    scenes: a(ref('scene','scene')),
    components: a(ref('components','component')),
    semantics: a(ref('semantics','semanticNode')),
    events: a(ref('interaction','event')),
    actions: a(ref('interaction','action')),
    states: a(ref('interaction','state')),
    motion: a(ref('motion','animation')),
    timelines: a(ref('timeline','timeline')),
    assets: a(ref('assets','asset')),
    cameras: a(ref('camera','camera')),
    lights: a(ref('lighting','light')),
    materials: a(ref('materials','material')),
    effects: a(ref('effects','effect')),
    compositions: a(ref('media','composition')),
    illustrations: a(ref('media','illustration')),
    videos: a(ref('media','video')),
    presentations: a(ref('presentation','presentation')),
    documents: a(ref('document','document')),
    threeD: ref('three-d','threeD'),
    game: ref('game','game'),
    accessibility: ref('accessibility','accessibility'),
    rendering: ref('rendering','rendering'),
    platformOverrides: a(ref('rendering','override')),
    validation: ref('validation','validation'),
    flows: a(ref('interaction','flow')),
    provenance: a(ref('references','assertion')),
    platforms: unique(en('web','apple','android','fluent','custom')),
    extensions: common('extensions')
  },
  allOf: Object.entries(profileRequirements).map(([profile, required]) => ({
    if: {required:['profiles'], properties:{profiles:{contains:{const:profile}}}},
    then: {
      required,
      properties: Object.fromEntries(required.filter((key) => arrayProperties.has(key)).map((key) => [key, {minItems:1}]))
    }
  }))
};
schemas.set('schema.json', root);

for (const profile of profiles) {
  schemas.set(`profiles/${profile}.schema.json`, {
    $schema: dialect,
    $id: `${base}profiles/${profile}.schema.json`,
    title: `Visual Spec 1.0 ${profile} profile`,
    description: `Constraints applied when the ${profile} profile is selected. Combine profile schemas when a document selects more than one profile.`,
    allOf: [
      {$ref: `${base}schema.json`},
      {properties:{profiles:{contains:{const:profile}}}}
    ]
  });
}

const semanticRules = [
  {code:'VS-ID-001', severity:'error', summary:'Document IDs must be unique.'},
  {code:'VS-REF-001', severity:'error', summary:'Identifier references must resolve to an object in the same document. Validators must not fetch external resources.'},
  {code:'VS-TOKEN-001', severity:'error', summary:'Token alias graphs must be acyclic.'},
  {code:'VS-TOKEN-002', severity:'error', summary:'Brace token references must name a token declared in the document.'},
  {code:'VS-TIME-001', severity:'error', summary:'Timed intervals must end at or after they start. Clips must fit their timeline and must not overlap on the same track.'},
  {code:'VS-GRAPH-001', severity:'error', summary:'Entity parts, component composition, scene instanceOf and joint parent graphs must be acyclic.'},
  {code:'VS-STATE-001', severity:'error', summary:'State transitions must target a declared state.'},
  {code:'VS-TOKEN-003', severity:'error', summary:'A token alias must target a token of the same type.'},
  {code:'VS-MOTION-001', severity:'error', summary:'Non-essential motion must declare a reduced-motion alternative.'},
  {code:'VS-MOTION-002', severity:'error', summary:'Keyframe offsets must be non-decreasing.'},
  {code:'VS-FLOW-001', severity:'error', summary:'A flow initial state and its transitions must name states declared on that flow.'},
  {code:'VS-PROV-001', severity:'error', summary:'A provenance path must be a JSON Pointer that exists in the document.'}
];

function doc(title, selected, body) {
  return {$schema:`${base}schema.json`, visualSpec:'1.0', metadata:{title, language:'en', status:'approved'}, profiles:selected, ...body};
}
const examples = {
  'hello.json': {
    $schema:`${base}schema.json`,
    visualSpec:'1.0',
    metadata:{title:'Hello Visual Spec'},
    profiles:['ui'],
    scenes:[{id:'scene.main', kind:'2d', nodes:[{id:'node.title', kind:'text', text:'Hello Visual Spec'}]}]
  },
  'ui.json': doc('Checkout card', ['ui'], {
    visualLanguage:{personality:['calm','precise'], principles:['use-motion-for-causality'], density:'comfortable', geometry:{radius:12, shape:'rounded-rectangle'}},
    tokens:{
      'color.brand':{type:'color', value:'#4b621c'},
      'color.ink':{type:'color', value:'#22261f'},
      'color.on-brand':{type:'color', value:'#f7f8f3'},
      'color.surface':{type:'color', value:'#ffffff'},
      'button.background':{type:'color', value:'{color.brand}'}
    },
    components:[
      {
        id:'component.primary-button', kind:'action.button', name:'Primary button',
        states:['default','hover','focus-visible','pressed','disabled'],
        anatomy:{slots:{label:{semanticRole:'text', required:true}}},
        appearance:{fill:'{button.background}', color:'{color.on-brand}', radius:8},
        accessibility:{role:'button', name:{source:'content'}, keyboard:{activate:['Enter','Space']}, focus:{strategy:'natural', visible:true}}
      },
      {
        id:'component.confirm', kind:'overlay.dialog', name:'Confirm dialog',
        anatomy:{slots:{
          title:{semanticRole:'heading', required:true},
          description:{semanticRole:'text'},
          actions:{semanticRole:'group', required:true}
        }},
        behavior:{modal:true, modality:'modal', dismiss:['escape','backdrop'], focus:{strategy:'programmatic', trap:true, restoreOnClose:true, initial:'node.button'}},
        accessibility:{role:'dialog', name:{source:'literal', value:'Review order'}, focus:{strategy:'programmatic', trap:true, restoreOnClose:true}}
      }
    ],
    scenes:[{
      id:'scene.checkout', kind:'2d', viewport:{width:440, height:520}, background:'#f7f8f3',
      layout:{type:'column', padding:24, gap:16, align:'stretch'},
      nodes:[{
        id:'node.card', kind:'container',
        layout:{type:'column', gap:12, padding:20, align:'stretch'},
        responsive:{strategy:'responsive', rules:[{when:{maxWidth:480}, layout:{type:'column', padding:12, gap:8, align:'stretch'}, priority:1}]},
        appearance:{fill:'{color.surface}', radius:12},
        children:[
          {id:'node.title', kind:'text', text:'Review order', appearance:{color:'{color.ink}', typography:{fontFamily:'Newsreader', fontSize:22, fontWeight:650, lineHeight:1.15}}},
          {id:'node.copy', kind:'text', text:'Shipping arrives Tuesday.', appearance:{color:'#73786e', typography:{fontFamily:'Manrope', fontSize:14, fontWeight:500, lineHeight:1.5}}},
          {id:'node.button', kind:'component', componentRef:'component.primary-button', text:'Continue'}
        ]
      },{
        id:'node.dialog', kind:'component', componentRef:'component.confirm',
        layout:{type:'column', padding:16, gap:8},
        appearance:{fill:'#ffffff', radius:12},
        children:[
          {id:'node.dialog-title', kind:'text', text:'Confirm checkout', appearance:{color:'{color.ink}', typography:{fontFamily:'Newsreader', fontSize:18, fontWeight:600}}},
          {id:'node.dialog-body', kind:'text', text:'Continue is a visual action. It does not call an API.', appearance:{color:'#73786e', typography:{fontSize:13, lineHeight:1.4}}}
        ]
      }]
    }],
    accessibility:{readingOrder:['node.title','node.copy','node.button','node.dialog-title'], reducedMotion:'respect', conformance:'WCAG-2.2-AA'},
    semantics:[
      {id:'sem.title', role:'heading', name:{source:'content', value:'Review order'}, nodeRef:'node.title'},
      {id:'sem.button', role:'button', name:{source:'content', value:'Continue'}, nodeRef:'node.button', componentRef:'component.primary-button'}
    ],
    states:[
      {id:'state.hover', name:'hover', targetRef:'node.button', appearance:{opacity:0.92}},
      {id:'state.pressed', name:'pressed', targetRef:'node.button', appearance:{opacity:0.84}, transitions:[{to:'state.hover', eventRef:'event.press'}]}
    ],
    events:[{id:'event.press', type:'activate', targetRef:'node.button', actionRefs:['action.confirm']}],
    actions:[{id:'action.confirm', verb:'open', targetRef:'component.confirm', intent:'Open the review dialog.'}],
    motion:[{
      id:'motion.enter', targets:['node.card'], essential:false,
      timing:{duration:{value:240, unit:'ms'}, delay:{value:0, unit:'ms'}, iterations:1, direction:'normal', fill:'forwards'},
      easing:{type:'cubic-bezier', x1:0.2, y1:0, x2:0, y2:1},
      tracks:[{property:'appearance.opacity', from:0, to:1, keyframes:[{offset:0, value:0},{offset:1, values:{opacity:1}}]}],
      interrupt:{policy:'retarget', preserveVelocity:true},
      reducedMotion:{strategy:'replace', duration:{value:1, unit:'ms'}}
    }],
    flows:[{
      id:'flow.checkout', initial:'flow.review',
      states:[{id:'flow.review', name:'review', sceneRef:'scene.checkout'},{id:'flow.done', name:'done', sceneRef:'scene.checkout'}],
      transitions:[{from:'flow.review', to:'flow.done', eventRef:'event.press', motionRef:'motion.enter'}]
    }],
    provenance:[{path:'/tokens/color.brand', method:'explicit', confidence:1, source:'manual:brand'}],
    platforms:['web'],
    rendering:{
      targets:[{id:'target.web', platform:'web', width:440, height:320, capabilities:[
        {name:'scene.2d', level:'required'},
        {name:'node.text', level:'required'},
        {name:'node.component', level:'required'}
      ]}],
      fallbackPolicy:'report-and-approximate'
    }
  }),
  'image.json': doc('Ceramic cup still', ['image'], {
    visualReferences:[{id:'ref.light', kind:'image', role:'source-of-truth', aspects:['lighting'], uri:'https://example.com/references/cup-light.jpg', locator:{image:{region:{x:0, y:0, width:1, height:1}}}, matchMode:'perceptual', confidence:0.9, provenance:{method:'explicit'}}],
    visualReferenceSets:[{id:'set.lighting', title:'Lighting baseline', references:[{referenceRef:'ref.light', aspects:['lighting'], priority:1}], conflictPolicy:'explicit-over-inferred'}],
    entities:[{id:'entity.cup', kind:'object.product', name:'Ceramic cup', lifecycle:'persistent', appearance:{fill:'#f4f1ea'}}],
    cameras:[{id:'camera.main', type:'photographic', framing:'close-up', focalLength:85, aperture:2.8, intent:'Isolate the glaze against a quiet ground.'}],
    lights:[{id:'light.key', type:'natural', role:'key', color:'#fff4e5', intensity:1},{id:'light.fill', type:'area', role:'fill', color:'#f7f8f3', intensity:0.35}],
    compositions:[{id:'composition.still', sceneRef:'scene.still', cameraRef:'camera.main', subjectRefs:['entity.cup'], rules:['rule-of-thirds'], intent:'Cup on the left third, negative space to the right.', subjectPlacement:[{entityRef:'entity.cup', bounds:{x:0.08, y:0.18, width:0.28, height:0.64}, priority:1}]}],
    scenes:[{id:'scene.still', kind:'2d', viewport:{width:640, height:400}, background:'#e7e2d8', cameraRef:'camera.main', lightRefs:['light.key','light.fill'], entityRefs:['entity.cup'], nodes:[{id:'node.cup', kind:'image', entityRef:'entity.cup'}]}],
    rendering:{targets:[{id:'target.still', platform:'web', width:640, height:400, colorSpace:'srgb', quality:'production', capabilities:[{name:'image.still', level:'required'}]}], fallbackPolicy:'report-and-approximate'}
  }),
  'illustration.json': doc('Mark study', ['illustration'], {
    tokens:{'color.ink':{type:'color', value:'#22261f'}, 'color.leaf':{type:'color', value:'#4b621c'}},
    visualReferences:[{id:'ref.mark', kind:'image', role:'inspiration', aspects:['shape'], uri:'https://example.com/references/orchard-mark.svg'}],
    entities:[{id:'entity.mark', kind:'graphic.symbol', name:'Orchard mark'},{id:'entity.leaf', kind:'graphic.symbol', name:'Leaf'}],
    illustrations:[{id:'illustration.mark', sceneRef:'scene.mark', technique:'vector.flat', style:'flat', palette:['#22261f','#d9ed94'], referenceRefs:['ref.mark']}],
    scenes:[{id:'scene.mark', kind:'2d', viewport:{width:360, height:220}, background:'#f7f8f3', layout:{type:'row', gap:28, align:'center', justify:'center'}, nodes:[
      {id:'node.mark', kind:'path', entityRef:'entity.mark', geometry:{type:'path', path:'M8 28 16 8l8 20'}, appearance:{stroke:{color:'{color.ink}', width:2}}},
      {id:'node.leaf', kind:'path', entityRef:'entity.leaf', geometry:{type:'path', path:'M6 26c8-18 18-8 20 2-8 4-14 0-20-2z'}, appearance:{stroke:{color:'{color.leaf}', width:2}}}
    ]}]
  }),
  'document.json': doc('Field notes', ['document'], {
    tokens:{'type.title':{type:'typography', value:{fontFamily:'Newsreader', fontSize:'22pt', fontWeight:600, textAlign:'start'}}, 'color.body':{type:'color', value:'#3c4336'}},
    documents:[{
      id:'document.notes', title:'Field notes', binding:'left', widows:2, orphans:2,
      pagination:{start:1, format:'decimal', position:'footer', showFirst:false},
      pages:[
        {
          id:'page.1', number:1, sceneRef:'scene.page', size:{width:'210mm', height:'297mm'},
          margin:{top:'18mm', right:'16mm', bottom:'20mm', left:'16mm'},
          sections:[{id:'section.opening', title:'Opening', nodeRefs:['node.title','node.body'], columns:1}],
          notes:[{id:'note.caption', kind:'caption', text:'A contract between reference and render.', anchorRef:'node.body'}]
        },
        {
          id:'page.2', number:2, sceneRef:'scene.page2', size:{width:'210mm', height:'297mm'},
          margin:{top:'18mm', right:'16mm', bottom:'20mm', left:'16mm'},
          sections:[{id:'section.follow', title:'Follow', nodeRefs:['node.follow'], columns:1, breakBefore:'page'}]
        }
      ]
    }],
    scenes:[
      {id:'scene.page', kind:'2d', viewport:{width:420, height:594}, background:'#fff', layout:{type:'column', padding:28, gap:14}, nodes:[
        {id:'node.title', kind:'text', text:'Field notes', appearance:{color:'#22261f', typography:{fontFamily:'Newsreader', fontSize:'22pt', fontWeight:600, textAlign:'start'}}},
        {id:'node.body', kind:'text', text:'A contract sits between the reference and the render.', appearance:{color:'{color.body}', typography:{fontSize:'11pt', lineHeight:1.5}}}
      ]},
      {id:'scene.page2', kind:'2d', viewport:{width:420, height:594}, background:'#fff', layout:{type:'column', padding:28, gap:14}, nodes:[
        {id:'node.follow', kind:'text', text:'Page two keeps the same margin and reading order.', appearance:{color:'{color.body}', typography:{fontSize:'11pt', lineHeight:1.5}}}
      ]}
    ],
    semantics:[
      {id:'sem.title', role:'heading', name:{source:'content', value:'Field notes'}, nodeRef:'node.title'},
      {id:'sem.follow', role:'heading', name:{source:'content', value:'Follow'}, nodeRef:'node.follow'}
    ],
    accessibility:{readingOrder:['node.title','node.body','node.follow'], conformance:'WCAG-2.2-AA'}
  }),
  'presentation.json': doc('Intent deck', ['presentation'], {
    presentations:[{
      id:'presentation.intent', title:'Intent',
      masters:[{id:'master.title', name:'Title', sceneRef:'scene.slide'}],
      slides:[{id:'slide.1', title:'One contract', sceneRef:'scene.slide', masterRef:'master.title', narrativeRole:'opening', notes:'State the handoff before the profiles.', timelineRef:'timeline.slide', duration:8, transition:{type:'fade', duration:{value:400, unit:'ms'}}}]
    }],
    timelines:[{id:'timeline.slide', duration:8, tracks:[{id:'track.slide', type:'visual', clips:[{id:'clip.slide', start:0, duration:8, sceneRef:'scene.slide'}]}]}],
    scenes:[{id:'scene.slide', kind:'2d', viewport:{width:960, height:540}, background:'#f7f8f3', layout:{type:'column', padding:48, gap:12}, nodes:[
      {id:'node.kicker', kind:'text', text:'Visual Spec', appearance:{color:'#4b621c', typography:{fontSize:14, fontWeight:700}}},
      {id:'node.headline', kind:'text', text:'One contract', appearance:{color:'#22261f', typography:{fontFamily:'Newsreader', fontSize:56, fontWeight:500}}, accessibility:{role:'heading', name:{source:'content', value:'One contract'}}}
    ]}],
    accessibility:{readingOrder:['node.kicker','node.headline'], conformance:'WCAG-2.2-AA'}
  }),
  'video.json': doc('Four second still', ['video'], {
    world:{id:'world.studio', name:'Studio', environment:{kind:'environment.interior'}},
    cameras:[{id:'camera.hold', type:'photographic', framing:'medium', intent:'Hold the subject without a move.'},{id:'camera.detail', type:'photographic', framing:'close-up', intent:'Move in on the glaze.'}],
    assets:[{id:'asset.room', type:'audio', uri:'https://example.com/media/room-tone.wav', mediaType:'audio/wav', duration:4}],
    motion:[{id:'motion.push', targets:['node.detail'], essential:false, duration:{value:2000, unit:'ms'}, tracks:[{property:'transform.scale', from:1, to:1.08}], reducedMotion:{strategy:'disable'}}],
    timelines:[{id:'timeline.main', duration:4, fps:24, tracks:[
      {id:'track.picture', type:'visual', clips:[{id:'clip.hold', start:0, duration:2, sceneRef:'scene.shot', cameraRef:'camera.hold'},{id:'clip.detail', start:2, duration:2, sceneRef:'scene.detail', cameraRef:'camera.detail'}]},
      {id:'track.audio', type:'audio', clips:[{id:'clip.tone', start:0, duration:4, assetRef:'asset.room'}]}
    ]}],
    videos:[{
      id:'video.main', timelineRef:'timeline.main', aspectRatio:1.777, audioAssetRefs:['asset.room'],
      shots:[
        {id:'shot.hold', sceneRef:'scene.shot', cameraRef:'camera.hold', start:0, duration:2, intent:'Static hold.'},
        {id:'shot.detail', sceneRef:'scene.detail', cameraRef:'camera.detail', start:2, duration:2, intent:'Push in.', transition:{type:'dissolve', duration:{value:12, unit:'f'}}}
      ],
      captions:[{id:'caption.hold', start:0, end:2, text:'A still hold.', language:'en'},{id:'caption.detail', start:2, end:4, text:'Then a closer hold.', language:'en'}]
    }],
    entities:[{id:'entity.subject', kind:'object.product', name:'Subject', appearance:{fill:'#d9ed94'}}],
    scenes:[
      {id:'scene.shot', kind:'2d', viewport:{width:640, height:360}, background:'#20261f', cameraRef:'camera.hold', nodes:[{id:'node.subject', kind:'image', entityRef:'entity.subject'}]},
      {id:'scene.detail', kind:'2d', viewport:{width:640, height:360}, background:'#20261f', cameraRef:'camera.detail', nodes:[{id:'node.detail', kind:'image', entityRef:'entity.subject'}]}
    ],
    rendering:{targets:[{id:'target.film', platform:'web', width:640, height:360, quality:'preview', capabilities:[{name:'video.timeline', level:'required', fallback:{strategy:'flatten', description:'Preview shows the shots as still frames.'}}]}], fallbackPolicy:'report-and-approximate'}
  }),
  'motion-graphics.json': doc('Title fade', ['motion-graphics'], {
    tokens:{'color.accent':{type:'color', value:'#d9ed94'}, 'color.ink':{type:'color', value:'#20261f'}},
    scenes:[{id:'scene.title', kind:'2d', viewport:{width:640, height:360}, background:'{color.ink}', layout:{type:'column', padding:48, gap:8}, nodes:[
      {id:'node.title', kind:'text', text:'Visual Spec', appearance:{color:'{color.accent}', typography:{fontFamily:'Newsreader', fontSize:64, fontWeight:500}}},
      {id:'node.version', kind:'text', text:'1.0', appearance:{color:'#f7f8f3', typography:{fontSize:18, fontWeight:650}}}
    ]}],
    motion:[{
      id:'motion.fade', essential:false, duration:{value:800, unit:'ms'},
      targets:['node.title','node.version'],
      tracks:[{property:'appearance.opacity', from:0, to:1}],
      children:[{type:'stagger', each:{value:80, unit:'ms'}, from:'first', seed:3, targets:['node.title','node.version'], motionRef:'motion.fade'}],
      reducedMotion:{strategy:'fade', duration:{value:1, unit:'ms'}}
    }],
    timelines:[{id:'timeline.title', duration:2, tracks:[{id:'track.type', type:'motion', clips:[{id:'clip.fade', start:0, duration:{value:800, unit:'ms'}, motionRef:'motion.fade', sceneRef:'scene.title'}]}]}],
    rendering:{targets:[{id:'target.title', platform:'web', width:640, height:360, capabilities:[{name:'scene.2d', level:'required'},{name:'motion.stagger', level:'required', fallback:{strategy:'flatten', description:'Preview shows the settled title, not the stagger.'}}]}], fallbackPolicy:'report-and-approximate'}
  }),
  '3d.json': doc('Cup study', ['3d'], {
    world:{id:'world.studio', name:'Studio', environment:{kind:'environment.interior', timeOfDay:'afternoon'}},
    entities:[{id:'entity.cup', kind:'object.product', name:'Ceramic cup', lifecycle:'persistent'}],
    materials:[{id:'material.ceramic', model:'pbr-metallic-roughness', baseColor:'#f4f1ea', roughness:0.45, metalness:0}],
    assets:[{id:'asset.cup', type:'model', uri:'https://example.com/models/cup.glb', mediaType:'model/gltf-binary'}],
    cameras:[{id:'camera.orbit', type:'perspective', fieldOfView:35, framing:'close-up'}],
    lights:[{id:'light.key', type:'directional', role:'key', color:'#fff4e5', intensity:1}],
    threeD:{
      sceneRefs:['scene.product'], assetRefs:['asset.cup'],
      skeletons:[{id:'skeleton.cup', rootRef:'joint.root', joints:[{id:'joint.root', name:'root'},{id:'joint.handle', name:'handle', parentRef:'joint.root'}]}],
      rigs:[{id:'rig.cup', skeletonRef:'skeleton.cup'}],
      meshes:[{id:'mesh.cup', assetRef:'asset.cup', geometry:{type:'cylinder'}, materialRefs:['material.ceramic'], skeletonRef:'skeleton.cup', lod:[{distance:0, assetRef:'asset.cup', screenCoverage:0.6},{distance:4, screenCoverage:0.15}]}]
    },
    scenes:[{id:'scene.product', kind:'3d', cameraRef:'camera.orbit', lightRefs:['light.key'], nodes:[{id:'node.cup', kind:'mesh', entityRef:'entity.cup', materialRef:'material.ceramic'}]}],
    rendering:{targets:[{id:'target.web', platform:'web', capabilities:[{name:'scene.3d', level:'required'},{name:'mesh.pbr', level:'required', fallback:{strategy:'omit', description:'This preview draws the solid and its material color, not a path-traced mesh.'}}]}], fallbackPolicy:'report-and-approximate'}
  }),
  'game.json': doc('Grove HUD', ['game'], {
    world:{id:'world.grove', name:'Grove', environment:{kind:'environment.forest', timeOfDay:'afternoon'}},
    entities:[{id:'entity.guide', kind:'living.person', name:'Guide', lifecycle:'persistent'}],
    materials:[{id:'material.guide', model:'unlit', baseColor:'#c4d68a'}],
    components:[{id:'component.status', kind:'feedback.toast', name:'Guide status', appearance:{fill:'#243024', color:'#f7f8f3', radius:999}, accessibility:{role:'status', name:{source:'literal', value:'Guide'}}}],
    effects:[{id:'effect.alert', type:'flash', targetRefs:['node.guide'], particles:{color:'#d9ed94', count:12}}],
    motion:[{id:'motion.alert', targets:['node.status'], essential:false, duration:{value:180, unit:'ms'}, tracks:[{property:'appearance.opacity', from:1, to:0.72}], reducedMotion:{strategy:'instant'}}],
    timelines:[{id:'timeline.intro', duration:3, tracks:[{id:'track.intro', type:'visual', clips:[{id:'clip.intro', start:0, duration:3, sceneRef:'scene.grove'}]}]}],
    scenes:[
      {id:'scene.grove', kind:'3d', nodes:[{id:'node.guide', kind:'character', entityRef:'entity.guide', materialRef:'material.guide'}]},
      {id:'scene.hud', kind:'2d', viewport:{width:390, height:96}, background:'#1c241c', layout:{type:'row', padding:16, align:'center'}, nodes:[{id:'node.status', kind:'component', componentRef:'component.status', text:'Guide'}]}
    ],
    states:[{id:'state.alert', name:'alert', targetRef:'node.status', appearance:{fill:'#d9ed94'}}],
    threeD:{sceneRefs:['scene.grove'], meshes:[{id:'mesh.guide', geometry:{type:'box'}, materialRefs:['material.guide']}]},
    game:{
      worldRef:'world.grove',
      levels:[{id:'level.grove', name:'Grove', sceneRefs:['scene.grove']}],
      characters:[{
        id:'character.guide', entityRef:'entity.guide',
        animationController:{initialState:'anim.idle', states:[{id:'anim.idle', name:'idle', loop:true},{id:'anim.alert', name:'alert', motionRef:'motion.alert'}], transitions:[{from:'anim.idle', to:'anim.alert', duration:{value:180, unit:'ms'}, blend:'crossfade'}]},
        visualStateMappings:{alert:{stateRef:'state.alert', motionRef:'motion.alert', effectRefs:['effect.alert'], appearance:{fill:'#d9ed94'}}}
      }],
      hud:{sceneRef:'scene.hud', componentRefs:['component.status'], safeArea:true},
      visualStates:[{id:'visual.alert', externalName:'alert', stateRefs:['state.alert'], effectRefs:['effect.alert']}],
      cutscenes:[{id:'cutscene.intro', timelineRef:'timeline.intro', skippable:true, restoreCamera:true}],
      spatialUI:[{mode:'entity-attached', anchorRef:'entity.guide', billboard:'camera', scaleMode:'screen', interaction:'none'}]
    },
    rendering:{targets:[{id:'target.play', platform:'web', capabilities:[{name:'scene.2d', level:'required'},{name:'mesh.pbr', level:'required', fallback:{strategy:'omit', description:'The grove mesh is drawn as a solid, not a shaded mesh.'}}]}], fallbackPolicy:'report-and-approximate'}
  }),
  'ui-3d.json': doc('Product configurator', ['ui','3d'], {
    tokens:{'color.glaze':{type:'color', value:'#d9ed94'}},
    components:[{id:'component.swatch', kind:'input.radio', name:'Glaze', appearance:{fill:'{color.glaze}', radius:999}, accessibility:{role:'radio', name:{source:'literal', value:'Glaze'}}}],
    entities:[{id:'entity.cup', kind:'object.product', name:'Configurable cup'}],
    materials:[{id:'material.glaze', model:'pbr-metallic-roughness', baseColor:'{color.glaze}', roughness:0.2, metalness:0}],
    lights:[{id:'light.key', type:'directional', role:'key', color:'#fff4e5', intensity:1}],
    threeD:{sceneRefs:['scene.stage'], meshes:[{id:'mesh.cup', geometry:{type:'cylinder'}, materialRefs:['material.glaze']}]},
    semantics:[{id:'sem.swatch', role:'radio', name:{source:'literal', value:'Glaze'}, nodeRef:'node.swatch', componentRef:'component.swatch'}],
    scenes:[
      {id:'scene.stage', kind:'3d', lightRefs:['light.key'], nodes:[{id:'node.cup', kind:'mesh', entityRef:'entity.cup', materialRef:'material.glaze'}]},
      {id:'scene.controls', kind:'2d', viewport:{width:360, height:88}, background:'#f7f8f3', layout:{type:'row', padding:16, align:'center', gap:12}, nodes:[{id:'node.swatch', kind:'component', componentRef:'component.swatch', text:'Glaze'}]}
    ]
  }),
  'presentation-video.json': doc('Narrated deck', ['presentation','video'], {
    cameras:[{id:'camera.opener', type:'photographic', framing:'wide'}],
    scenes:[{id:'scene.opener', kind:'2d', viewport:{width:960, height:540}, background:'#20261f', layout:{type:'column', padding:48, justify:'center'}, nodes:[{id:'node.word', kind:'text', text:'Begin', appearance:{color:'#d9ed94', typography:{fontFamily:'Newsreader', fontSize:72, fontWeight:500}}}]}],
    timelines:[{id:'timeline.opener', duration:6, fps:24, tracks:[{id:'track.picture', type:'video', clips:[{id:'clip.opener', start:0, duration:6, sceneRef:'scene.opener', cameraRef:'camera.opener'}]}]}],
    videos:[{id:'video.opener', timelineRef:'timeline.opener', shots:[{id:'shot.opener', sceneRef:'scene.opener', cameraRef:'camera.opener', start:0, duration:6}], captions:[{id:'caption.begin', start:0, end:6, text:'Begin.', language:'en'}]}],
    presentations:[{id:'presentation.narrated', slides:[{id:'slide.opener', title:'Begin', sceneRef:'scene.opener', timelineRef:'timeline.opener', duration:6, transition:{type:'fade', duration:{value:300, unit:'ms'}}, notes:'Hold the word, then cut.'}]}]
  })
};

function bundleSchemas(modular) {
  const defs = {};
  for (const [file, schema] of modular) {
    const match = file.match(/^modules\/([a-z0-9-]+)\.schema\.json$/);
    if (!match) continue;
    defs[match[1]] = {};
    for (const [name, definition] of Object.entries(schema.$defs ?? {})) defs[match[1]][name] = rewrite(definition, match[1]);
  }
  const body = rewrite(root, 'root');
  delete body.$schema;
  delete body.$id;
  return {
    $schema: dialect,
    $id: `${base}schema.bundle.json`,
    title: 'Visual Spec 1.0 standalone bundle',
    description: 'Single-file distribution of Visual Spec 1.0. Every reference resolves inside this document.',
    ...body,
    $defs: defs
  };
}
function rewrite(node, moduleName) {
  if (Array.isArray(node)) return node.map((item) => rewrite(item, moduleName));
  if (!node || typeof node !== 'object') return node;
  const outNode = {};
  for (const [key, value] of Object.entries(node)) outNode[key] = key === '$ref' && typeof value === 'string' ? rewriteRef(value, moduleName) : rewrite(value, moduleName);
  return outNode;
}
function rewriteRef(value, moduleName) {
  const remote = value.match(/^https:\/\/visualspec\.dev\/schema\/1\.0\/modules\/([a-z0-9-]+)\.schema\.json#\/\$defs\/([A-Za-z0-9_-]+)$/);
  if (remote) return `#/$defs/${remote[1]}/${remote[2]}`;
  const local = value.match(/^#\/\$defs\/([A-Za-z0-9_-]+)$/);
  if (local) return `#/$defs/${moduleName}/${local[1]}`;
  throw new Error(`Unresolved schema reference: ${value}`);
}

const bundled = bundleSchemas(schemas);
if (JSON.stringify(bundled).includes('/modules/')) throw new Error('Standalone bundle still points at a module file');

function compile(label, schema, library = []) {
  const ajv = new Ajv({strict:false, allErrors:true, validateSchema:false});
  addFormats(ajv);
  for (const item of library) ajv.addSchema(structuredClone(item));
  return ajv.compile(structuredClone(schema));
}
const modularValidator = compile('modular', root, [...schemas.values()].filter((schema) => schema.$id !== root.$id));
const bundleValidator = compile('bundle', bundled);
const failures = [];
for (const [name, example] of Object.entries(examples)) {
  for (const [label, validate] of [['modular', modularValidator], ['bundle', bundleValidator]]) {
    if (validate(example)) continue;
    failures.push(`${name} failed ${label} validation:\n${validate.errors.map((error) => `  ${error.instancePath || '/'} ${error.message}`).join('\n')}`);
  }
}
if (failures.length) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}

const files = new Map();
for (const [name, schema] of schemas) files.set(name, schema);
files.set('schema.bundle.json', bundled);
files.set('manifest.json', {
  name:'visualspec', version:'1.0.0-rc.1', specification:'1.0',
  schema:`${base}schema.json`, bundle:`${base}schema.bundle.json`,
  profiles, modules:[...schemas.keys()].filter((name) => name.startsWith('modules/')).map((name) => name.slice('modules/'.length).replace('.schema.json','')),
  semanticRules
});
files.set('semantic-rules.json', {specification:'1.0', rules:semanticRules});
const catalog = [...schemas.entries()].filter(([name]) => name.startsWith('modules/')).map(([name, schema]) => ({
  name: name.slice('modules/'.length).replace('.schema.json',''),
  title: schema.title, description: schema.description,
  definitions: Object.keys(schema.$defs ?? {})
}));
files.set('catalog.json', {modules: catalog});

mkdirSync(resolve(out, 'modules'), {recursive:true});
mkdirSync(resolve(out, 'profiles'), {recursive:true});
mkdirSync(resolve('packages/schema/examples'), {recursive:true});
const sums = [];
for (const [name, value] of files) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(resolve(out, name), text);
  sums.push(`${createHash('sha256').update(text).digest('hex')}  ${name}`);
}
const exampleIndex = [];
for (const [name, value] of Object.entries(examples)) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  writeFileSync(resolve('packages/schema/examples', name), text);
  exampleIndex.push({file:name, title:value.metadata.title, profiles:value.profiles});
}
writeFileSync(resolve('packages/schema/examples', 'index.json'), `${JSON.stringify(exampleIndex, null, 2)}\n`);
writeFileSync(resolve(out, 'SHA256SUMS'), `${sums.sort().join('\n')}\n`);
console.log(`Wrote ${files.size} schema files and ${exampleIndex.length} examples`);
