"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { motion, useScroll, useTransform, AnimatePresence, MotionConfig } from "framer-motion"
import {
  Mail,
  Phone,
  MapPin,
  Download,
  Code,
  Database,
  Globe,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  CheckCircle,
  Send,
  Square,
  CalendarDays,
  BarChart3,
  Zap,
  Bot,
  MessageCircle,
  Rocket,
  Monitor,
  Server,
  Smartphone,
  Palette,
  Settings,
  Network,
  FileText,
  Terminal,
  GitBranch,
  Layers,
  Shield,
  Cloud,
  Cpu,
  HardDrive,
  PenToolIcon as Tool,
  BookOpen,
  Calculator,
  PieChart,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// ---------- helpers ----------
/**
 * Try to parse the response as JSON, but gracefully fall back to plain text
 * when the payload is not valid JSON (e.g. an HTML error page).
 */
const parseResponse = async (response: Response) => {
  const contentType = response.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    try {
      return await response.json()
    } catch {
      /* fall-through and return text */
    }
  }
  return response.text()
}
// --------------------------------


// Fixed particle values prevent hydration differences and repeated random work on every render.
const FLOATING_PARTICLES = [
  { left: "8%", top: "14%", duration: 12, delay: 0.4 },
  { left: "18%", top: "72%", duration: 14, delay: 2.1 },
  { left: "27%", top: "35%", duration: 11, delay: 4.2 },
  { left: "36%", top: "86%", duration: 15, delay: 1.2 },
  { left: "44%", top: "20%", duration: 13, delay: 6.3 },
  { left: "52%", top: "61%", duration: 16, delay: 3.4 },
  { left: "61%", top: "9%", duration: 12.5, delay: 7.1 },
  { left: "68%", top: "78%", duration: 14.5, delay: 5.1 },
  { left: "74%", top: "31%", duration: 11.5, delay: 8.2 },
  { left: "82%", top: "66%", duration: 15.5, delay: 2.8 },
  { left: "91%", top: "18%", duration: 13.5, delay: 9.1 },
  { left: "95%", top: "88%", duration: 12.8, delay: 4.8 },
  { left: "13%", top: "48%", duration: 16, delay: 7.7 },
  { left: "57%", top: "43%", duration: 13.2, delay: 1.8 },
  { left: "87%", top: "47%", duration: 14.2, delay: 6.7 },
] as const

type ChatMessage = {
  id: number
  role: "assistant" | "user"
  content: string
  isTyping?: boolean
}

type KnowledgeIntent = {
  id: string
  topic: string
  patterns: string[]
  keywords: string[]
  answers: string[]
  priority?: number
}

const chatbotSuggestions = [
  "Where did Mbali attend high school?",
  "What course is she studying?",
  "Why should a company hire her?",
  "Who funds her studies?",
  "Which IT roles suit her?",
  "What projects has she completed?",
]

const CHAT_NORMALIZATION_RULES: Array<[RegExp, string]> = [
  [/\b(mab|mabli|mbalie|mbail|mabali|mballi|mbalii|mbli|mablii|mbaliii)\b/g, "mbali"],
  [/\bdyobisoentle\b/g, "dyobiso"],
  [/\b(bcs|bscs|bachelor science)\b/g, "bsc"],
  [/\b(information tech|info tech|it degree)\b/g, "information technology"],
  [/\b(cyber security|cyber-security)\b/g, "cybersecurity"],
  [/\b(full stack|full-stack)\b/g, "fullstack"],
  [/\b(back end|back-end)\b/g, "backend"],
  [/\b(front end|front-end)\b/g, "frontend"],
  [/\b(highschool|high-school|secondary school|secondary education)\b/g, "high school"],
  [/\b(primaryschool|primary-school|elementary school)\b/g, "primary school"],
  [/\b(schoool|shcool|scool|schol)\b/g, "school"],
  [/\b(corse|coures|cours|programme of study|program of study)\b/g, "course"],
  [/\b(universty|univeristy|univesity|varsity|uni)\b/g, "university"],
  [/\b(complte|compelete|complet|finished|finish|graduated from)\b/g, "complete"],
  [/\b(attented|attendded|went to|go to|studied at)\b/g, "attend"],
  [/\b(matrc|matriculation|grade twelve|grade 12)\b/g, "matric"],
  [/\b(vanderbiljpark|vanderbijpark|vanderbilpark|vanderbijl park)\b/g, "vanderbijlpark"],
  [/\b(north west university|northwest university|nwu university)\b/g, "north-west university"],
  [/\b(st helens|saint helen|saint helens)\b/g, "st helen"],
  [/\b(hcl technologies|hcl tech)\b/g, "hcl technology"],
  [/\b(soft skill|soft skills|people skills|personal skills)\b/g, "core competencies"],
  [/\b(resume|curriculum vitae)\b/g, "cv"],
  [/\b(graduate program|grad programme|grad program)\b/g, "graduate programme"],
  [/\b(job role|career path|career area|area of it|field in it|field of it|technology field)\b/g, "it field"],
  [/\b(tech stack|technology stack|technical stack|tools and technologies)\b/g, "technology stack"],
  [/\b(data base|data-base)\b/g, "database"],
  [/\b(rest api|rest apis|restful api)\b/g, "restful apis"],
  [/\b(born at|birth hospital)\b/g, "born hospital"],
  [/\b(date of birth|birth date|birthday|dob)\b/g, "birthdate"],
]


/**
 * Lightweight, dependency-free spelling support for the local portfolio bot.
 *
 * The vocabulary contains 5,000 frequency-ranked English words plus Mbali's
 * names, places, education terms and technology vocabulary. Corrections happen
 * only inside the chatbot's normalized copy of a question; the visitor's typed
 * message is never changed on screen.
 */
const COMMON_SPELLING_WORDS = `the of and to in that he was it his is with as had for at by on not be from but you or her him which were all this she
they are have said an one who so what there their when been may if no up my them into more out pierre would prince me
we did only could now man its has will then some time after do other about such before very how should over your these
natasha new than any those well old first andrew himself men two down face upon see can like french our same know
without went made little long states came where under room must even eyes come still princess being most go thought
people war life again way another away general hand left day through began great own also asked rostov while just army
looked american say count am back good whole shall head moscow right mary part government felt seemed here yes us
something why having place much state house against between every though nothing emperor heard nicholas off because
young bone take disease many always napoleon saw never three don skin tissue took years once look last united think
round found blood power too met might father kutuzov both usually small give side form let make during quite turned
door countess knew suddenly tell told looking whom yet already moment love large get holmes end chapter treatment
officer voice russian words few hands cases days among everything called dear sonya congress seen often gave battle
history case taken put denisov law position however done ll smile sometimes country free soon understand each known
soldiers oh others become far brought along order especially sat behind women course result night patient stood joint
work anything cause going evidently several president less passed wife infection matter given god feeling world
certain mr chief front does action whether white question movement condition son herself mind possible alone body
morning horse later toward death dolokhov followed present labor necessary money almost open set until woman nerve
want ran act expression things fig replied use sent troops half south business officers became within mother england
commander year pp taking themselves wound pain thing number leave america above added party word parts table home lay
anna find boris either near tissues constitution enemy continued fact high letter four project public red common held
talk example west illustration important national cried friend carried entered got nor received second five land
surface light cannot next used glands different ever fire itself union really twenty around early saying sitting best
petya full better british evening gutenberg arm bones horses name political road since together thousand cold heart
forms speak shouted means ask kept impossible arms due vessels line moved petersburg becomes rose vasili wish
conditions system tuberculous drawing gone rise force third king de everyone short times black formed pressure hair
clear fellow laws longer children remained help ready regiment forward hundred results air military myself north peace
rode wounded answered beyond crowd growth tried lost news anyone orders past point service tumour across ah anatole
interest understood bed reached strange close process rather read sound ten beside frequently happy opinion self spoke
standing coming limb making opened presence trade till deep formation soldier affairs aneurysm operation show wanted
field raised thus english slavery family repeated stopped rest wished following happened perhaps turning colonies
seeing applied answer true muscles affected events neck occur period talking kind revolution able else won foot cut
appeared call rapidly associated german husband led lower southern abscess terrible york least lymph returned russia
spread company local middle attention features noticed reason campaign ff return wall merely re tumours silent steps
turn whose effect water giving laid therefore window wounds federal person soft speaking subject dinner size believe
daughter doctor hear honor strength waiting colonial immediately placed quickly conversation dark questions trying
city hard street feet measures view bolkonski doing removed usual account brother civil fell foreign former lady paper
sir child forces glanced nearly republican six enough fine character closed particularly town afraid considerable
court hardly severe single coat freedom please sides tears joints knee symptoms cancer france ground human meet nature
seat syphilis acute boy covered gangrene nation remarked society although artery changes neither rights soul strong
spirit swelling adjutant fear girl grew hours reply thin tone washington bring helene late pale according considered
dead except mouth area faces yourself feel remember smiling clinical fresh need rostovs someone village lesions plan
special contrary smiled ulcer attack hour members bagration bridge employed finally friends listened alexander bad pus
various membrane pass drew europe growing haemorrhage occurs takes ve doubt muscle pavlovna primary command convention
described independence syphilitic appear change george glad causes decided hope john nerves powers relations showed
voices wrote difficult ordered russians secondary suppuration terms virginia drawn fixed probably st direction fingers
killed liable lips minutes opening republicans says unable complete frightened governor leg natural run struck capital
holding sister smoke staff study beginning blue carriage colonel cry greater happiness loss moving keep mademoiselle
declared direct firm idea master method remain serious running consists group heavy increased indeed pleasure relation
sarcoma simple step camp dress further ill influence marked prepared age alpatych instead lead property thinking
vessel diseases duty industry leaders matters silence appearance chair expressed living manner march uncle changed
chiefly passing prevent seems veins besides lines popular slowly story term angry attended leaving lord produced seven
activity dry low mikhaylovna observed office victory bourienne cells clearly east effort injury months upper dressing
established historians latter poor sight similar tendon corner eight excellency live loved pay series silver tm broken
captain destroyed divided everybody peasants wait expected future book gold jefferson organisms shoulders thoughts
ball danger fall rostopchin straight tariff explain kissed resulting sure thirty uniform control easy finger portion
pressed prisoners asking chronic majority occurred purpose rule subcutaneous arrived clock economic filled health
produce remembered certainly commerce election hot individual persons presented ulcers articular distance exclaimed
interests legs lying meeting quiet administration church earth follow generals handsome houses importance mamma
massachusetts post region section spite weeks western written affair glass occupied policy politics seem shoulder vein
bacteria below increase laughing leading meaning movements note ought suffrage truth bright diagnosis drove easily
hold papers reading rushed seized senate slight territory whatever aid development division lived marya meant shown
sleep treaty advanced farmers guns miss pyogenic river suffering tomorrow destruction event royal spent varieties
balashev difficulty evident eye miles none outside passage railways regarded save settled vote bank citizens main
normal shouting solution ago aim appears borodino equal experience injuries letters plain removal stage circumstances
enter hill interrupted involved married surprise tea care floor forty healing hussars infected paid value wilson aside
dmitrievna hat talked thank wide cartilage directly showing support surrounded carry connection efforts ends farther
fibrous figure ladies nations nose object progress sense temperature wrong caused dressed experienced frenchman knows
lesion majesty ordinary real smolensk instant issue larger laughed mass move sherlock authority connective discharge
external flank fluid galloped gentlemen grown learned listen path population surrounding walked begun bill european
extent gentleman happen parties send sign stop works absence avoid beautiful bent berg consider fate glancing
industrial mean notice ranks signs synovial begin cap carolina characteristic democracy knowing sake source whispered
active break cavity chance cross desire escape fight finished imagine marriage mucous northern opposition pleasant
rapid reaction readily representatives started tenderness threw advance bound broke closely colour completely higher
marry multiple pennsylvania play pleased practice receive shot superficial treated week bonaparte cannon degree fifty
gazed police retreat sounds unless adjacent century circulation democrats despite guards hearing hills inflammation
measure original private soil success thousands today amount bodies broad constitutional dangerous elbow essential
getting internal jackson methods ohio particular proposed required rich slaves spoken thrown allow appointed boots
calm comes composed continually generally glance iii official personal roosevelt sad simply sort caught entirely
firing loose pointed porch acts amendment believed directed eh fat gradually gray huge joy lie listening occasionally
places possibility scar significance sit sought stand estate gives indicated looks malignant pointing provided
servants tender wood accepted affections asleep carrying contact ebook engaged express maid offered rays regard report
shock situation try type unknown wearing allowed articles bear breast die drive excited foundation kindly lies lodge
necessity nonsense per rarely rooms rupture snow write accompanied apart brilliant including justice plans pretty
reach tendency weak amid cossacks duties forget hussar infantry james millions nearer painful peculiar rising slightly
sofa supply tax twice agitation burning carts cossack died hall heat lincoln minute points rare recognized sharp
variety watson angrily bald becoming big convinced effects forth granulation principles prove sea sovereign speech sun
tikhon towards adams adopted approached chest companion conception democratic favor goods grand highest introduced
press pushed quick secret social sore visit vol bleeding concerned cotton dying exposed handed inhabitants
interference limited opposite paris promised proved serfs surprised americans cavalry evidence familiar laughter
legislature mere needed osteomyelitis pacific paused pray quietly speranski sudden suite theory yard arrested battery
bennigsen circle consciousness definite feelings flushed fourth hamilton involuntarily iron liberty likely major
marrow mississippi operations origin ourselves peasant problems repair slave throughout touched towns understanding
valley actions agree application arteries beneath britain built burned cent cities deeply demand equally fields
formerly ii immense ones raising remarkable respect sorry splendid thick tuberculosis wealth address anti attempt
central council forced forest founded joined lands london periosteum problem prominent regular seldom spot stream
struggle teeth arranged box bursa conflict crossed extended fever food ha island liked mainly obtained paralysis pity
risk separated sufficient telling tushin vera walk warm yellow addressing bare domestic dull extraordinary genius grow
hurriedly lit material minister muscular muttered secure shed spain stay supreme surfaces tall visitor affection
amputation burst chosen class companies constant enormous firmly independent information moreover powerful putting
railway remains sac sensation ship streets trunk useful worn abandoned addition addressed afterwards attitude blow
canal carefully clay devil empire enterprise examination extreme facts fallen greatest guests innocent lifted million
oedema proportion quarters refused settlement silently stone tendons touch walls absolutely agreed alive arthritis
assume austrian bezukhov blame bowed brown club compromise cure current frontier girls interesting julie knowledge
nesvitski onto otherwise riding rubles shaft skull walking agreement august beauty cellular center charge clot edges
gauze heaven lad laugh masses nurse shook sole spring square weight worth assumed characters copyright deal derived
elements enlarged fully germany heads increasing journey mexico michael organized separate share sheath suggested
visitors writing yesterday apparently approaching arrival bacillus bilibin commercial conscious containing darkness
distinguished dreadful entering garden legislatures obvious policies returning sky trust wrist announced confused cyst
defense details didn fighting follows freely gazing groups impression kuragin limbs occurrence previous promise rate
referred satisfaction start subjects throat wars youth animated attacks branches cysts demanded driven expecting femur
final forehead immigration infective intention marshal mentioned opportunity pressing relief sacrifice spanish
squadron surgical tongue wishing worse accustomed admit attacked bell cost debt diffuse doctrine gate green historical
interested numbers parliament philadelphia scarcely slow space stern tubercle widely actual ashamed boston commanders
determined dog existence faith false fibres forgive forgotten fracture germans happens horror industries irritation
karataev loud month nine notes permanent reasons serve ships supper views william advantage advice anxious bit ceased
colonists conduct degeneration entire failed fatal gun length managed moist presents protection recognised seriously
served suffered taxes texas wolf armies calling charming cloak clothes column commission created debts distribution
domain excellent excitement feared forming heavily join kentucky louisiana mine mixed practical shape sprang spreading
stepped stout absorbed acid admission admitted breaking clean contraction credit crime crown curiosity decision empty
expect feature fifteen fond grant inevitable language legislation narrow piece planting prolonged summer tibia wine
arrest commonly comparatively confined departure edge everywhere explained fifth finding gesture goes granulations
healthy hurrah injection inner lives motion nail played prisoner satisfied science sheaths sorrow supplies torn
triumph visible votes wet anger books dropped entrance estates famous gathered insisted mistaken mrs naturally page
patients physical planters playing reform search situated striking suppose acting approval brain burns conclusion
confusion deeper disappeared ears electronic explanation extension forever gentle greatly hurried hut intended issued
leadership missouri organs raw reaching reception rules shadow swollen uttered vice watched wore accept acquired
animal colony concluded daniel destroy education function ideas immediate kill leucocytes noticing offer pulled
resolution sighed smooth somewhere stupid sympathy terror train trouble trusts unexpectedly venous absent absolute
access acquaintance artillery avoided based beg candidate cart clever develop friendly grain guard handkerchief
hastily helped interior keeping lip merry moments music partly performed pipe portions principle republic resources
simon sinus successful tsar vary virtue agriculture appeal article aspect badly bought busy california captured
crowded defined delegates draw drink epithelium evil fair game grafting habit hero household injured iv knees la le
leaning memory possession previously replaced ring solemn suffer varies abroad ankylosis armed authorities bacterial
band banks capable cast causing choose contest countries crossing delicate diplomatic dron eat ebooks enlargement
exercise falling franklin georgia highly imperial makes merchants mon nervous opposed pure receiving recent recognize
religious reports ride sections standard working attached austria awaiting base building cleared confidence
considering deformity excuse executive faced federalists gown humanity inflamed intimate leader league level murat
nice operative progressive protective remove scattered serum sick spreads sum test ulceration unions unpleasant
welfare agitated alarm aroused assistance aunt aware barclay bonds branch cheerful coachman connected consent depends
dignity extremity fit fool fought gland hollow holy hyperaemia informed isn legal ligation market occupation
permission peter platform provisions raise recalled reported resembling revolutionary secretary shouts station
stretched tend transferred ways weary winter alliance austerlitz committed connecticut describe desired developed
distant extensive extremely frequent henry hippolyte inevitability inherited layer lose mood moral necrosis occasion
october overlying pistol pocket radium recovery remark saved seated separation sixth smaller sugar th thumb toes
toxins trees urged vienna waited watch whisper ancient assistant attain balls brothers buy centre contents continue
contrast corps currency declaration eager eastern elastic fancy farm fault figures frenchmen imagination instance
irregular jumped member midst mild nearest numerous papa preparing print purchase purposes realized shaking shaped
shirt shows silk smell starting traumatic trunks wages windows agents armchair assembled baker ballot bandage columns
compared double epidermis examined exposure fashion finish flew frowning glory grave growths hart highness interfere
joyful junction modern profound pulse scene selected septic singing sold stronger substance task tennessee trembling
vicinity violence wind aide arose blushed bogucharovo bringing compelled constantly conviction date difficulties
dispute dr driving engagement flight flow footman forearm hundreds imagined inflammatory irish list maintain
management noble northwest orderly patches proper province rates regimental revealed ruin ruined secured sinuses tends
throw tobacco useless using vast weakness abdominal approved art beaten begins bitter border cards cheeks
confederation continuous delay donations doors drop epithelioma exactly extend fellows gap grief happening hip
historic illness income indians kiss markets monroe owing pfuel provide rapidity repeating resistance review safe thy
wheels worthy anxiety attempts autumn beat benefit bore bottle bullet choice comrades continental copy cord defeat
difference dollars duke ear embraced fortunes granted headquarters hospital incision indian induced inquired instantly
instructions international loudly mention message nodded polish prepare provision quarter remarks serous servant
somewhat stamp stranger tertiary throwing underwood unlike yours abscesses advancing association baby battalion
bedroom catch corn couple dancing despair disappear discovered doctors dolgorukov dream energy establish exhausted
families federation gained hung hurry judge meanwhile monsieur mustache namely older peoples perfectly price prices
proclamation production rank related rough scale senator senators specially stages supposed thoroughly tube unexpected
adhesions capture changing clouds conservative courts daily dense diminished ease elected exist favorite feeble
forests friendship gain invited june louis madison manifestations medium militia owners positive powder preparations
prevented proud reference roads september severity stories undergo valet vascular watching absorption ahead apply
arakcheev balance beard bow breathing bullets careful cheek china claim combination combined dare deformans delight
distinct fortune frowned humerus hunter icon included increases inquiry inside invasion iodoform letting localised
losing madame manufactures mounted needs parents ports program removing resolute retired sharply sons sores sterilised
stomach structures surgeon surroundings territories thirds twelve vicomte voters altered angel apparent bearing bottom
carriages cattle cleveland color communication cutaneous davout dealing disturbance excessive favored gallop guilty
hanging harm hay immigrants jersey joseph knife literary loving mercy obtain organization pains prayer provinces race
reconstruction refuse represented respectfully rid role saber satisfactory sequestrum settle softly spirits statement
sternly stretching surgery sword tetanus thou thrust top trap tree varicose weather wishes wool affecting alexeevich
areas assured battles childhood cicatricial civilization courage cruel depend devoted distributed elson existed facing
factor fascia fill grounds hopes illinois incomprehensible intellectual january knoll lightly maryland match merchant
mist naval non november photograph pride producing protect reasoning record reduced responsibility retained rolled
saddle sensibility shell shone sobs solid spectacles steadily strongly structure superior touching utter vital
vitality warfare younger acquaintances actually aet animals anywhere approach assembly basis borne burn cellulitis
cervical charles claims coast collected cousin covering dance december directions doesn elder enthusiasm equality
establishment executed fail financial fled grass heal hide july license ligature liver maintained male needle newly
pace packed pair pause peripheral persistent quantity ray reflected remaining request restored sergeant shining shut
signed spinal tail tension tied tired vigorous whip worked zherkov accomplished advantages affect appointment
artificial baggage belonged capacity career coal coats committee compression contempt determine doubts dust eagerly
ended enemies failure fast february femoral fly grey habits haven historian ilyin intervals leaned leucocytosis
macdonald machine manufacturing mexican mills mistake mystery native nevertheless observation oil opinions organism
payment perfect periosteal picked plainly proposal prussia pushing rain range ratification representative restrain
revenue serene significant sleigh stayed steward strike supported thanks thigh thrombosis title vague viii wants
weyrother workers accounts adjutants alcohol angle arguments arterial bells bold born breath bursae calhoun cease
check cloth concerning consisted constitutions correct cover darling delighted detail dirty dislocation dogs fires fur
gaily goodness hoped innumerable issues joyfully kissing lads lavrushka learn leaves lestrade liberal lupus lymphatics
map mark mckinley mysterious named navy nodules noise obviously ossifying paces paying precious pulsation regeneration
regions reign rucastle seek sending services setting shoes sigh song swept swiftly temper threatened treasury trial
trivial villages wagons wedding wheat whenever win withdrawn acted alike answering archive available awaited axilla
axis battlefield bony collar continent culture damaged debate deed dessalles detachment disposition distinctly
district elections employees focus folk frost gently headed lamp masters mccarthy mental obligations observe offices
onset oregon personally phenomena protests realize recall reproach safety screamed seas senseless serving settlers
spaces specific surrender suture universal unnatural vi wonder wooden abolition acres ankle anteroom applying assumes
attracted awkward ballroom bird boldly candle circles college confess confirmed consideration contains devised discuss
disorder disturbed dozen dressings emotion exceptional exchange execution eyebrows fired frame galloping gloomy grafts
grasp groin gumma hare height hounds imposed interview jaw joke mad mankind mercury mud nobody offended ossification
paced pathological preferred regiments research restoration seeking sentiment sing singular spoon steady stick
supplied taft taxation timidly toe trace unfortunate unite whigs worst yield apt arrangement canals chamber chemical
closer closing commands corridor definitely delaware deprived destroying diplomacy dispositions emperors enjoyed
examining excision extending farms flying gay homes hunting instrument intra leather lifting limit lot materials
mechanical motionless nullification ours outcome passion periods possessed preserve processes provincial purulent
reaches recognizing rejected religion rounded rush sank scars sensitive shade shrugged skeleton slept spine stained
staying stir summoned sweet tormented total vanished wild adventure afternoon altogether arrange arthur begged bending
bills board borzois bread burden chose churches comfort compressed confederate corporation criticism crowds cutting
cystic declaring delirium department designed detached disappearance dissatisfied distinguish divine dragged dunyasha
effusion enacted existing flat fractures frequency gates glittering governments hurt include indication injected
institutions intense ivanovich jacket margins marshall metal ministers mission natured packing palm paragraph partner
phrase possibly prognosis rendered resolved reward salt sang scotch skill spiritual statesmen stiffness strain strict
succeeded thickened topics unhappy uniforms varying vii xvi yards affects alabama alien anatomical april bacilli
breakfast cab capsule client combinations controversy crisis dared decide diseased earlier elderly erysipelas
eventually exception expense fatherland generation holder ilya inquiringly islands italian judges judgment lack
learning lock lowered misfortune negotiations officials operating otradnoe painted palace peri petition pioneers
portrait poured preparation presidential providing pursued recognition redoubt references resist returns rhode ridden
roof school situations sleeping sooner stock stopping storm synovitis thomas tide types valuable varix vous witness
wrapped abandon appropriate argument attained attentively axillary brows charter christ commanding concern confident
demands denounced depressed deserted desperate dominion drunk ermolov esaul exceedingly fibroma flexed goose hence
improvement individuals inevitably inform interval keen leads lift lined lipoma louder marrying melancholy migration
mile mingled nails obliged overcome owner passionate passive plump practically priest principal quarrel recovered
renewed resemble reserve responsible restless ringing rubbed saving sclerosis securing seizing shame sire site sounded
spend stationed sufficiently tarutino thereby thirteen tones track unusual vilna virus warning wing accused aged
animation appearances assumption authorized belief benefactor campfires carbolic challenge charm complications conceal
concentrated conference congenital contract controlled cries defeated descended dining discussed discussion driver
duel essence expedition expressing federalist feels flag footmen footsteps forgetting frank glasses governors
gummatous haired hunt hydrops indicate indifferent inspector introduction lasted legislative ma memories moderate
necessarily newspapers nobility orleans pack permit posterior preventing recommended retain searching seize sixteen
sources speed sphere stairs stars stroke submit suitable suppurative swaying telyanin temporary timid trademark treat
typical undoubtedly university wealthy additional ambassador anatomy banking blisters blocked blushing buonaparte card
chain chancre chin classes cloud co condemned confederacy connections considerations criminal cuba dam daughters
denied dependent depth draft elephantiasis epithelial escaped escapes eve excluded filling flung grows haste hearts
hers hostile hungry iliac insignificant intently iodine lateral likewise lise lovely maids medial mighty murder oak
opponents peaceful pelvis popliteal privileges proof reality rear recently recover refund refusal regulation risen
rosy seaboard sell simplicity sixty sleeves slipped slough status steam steel stores subjected swift tight timokhin
uncertain unnecessary urine vain ventured violent volume waters wear westward wonderful accord advocates alarmed
arrangements assurance attempted attend author awful brightly bushes caleche calls cavities chairs clearing compare
complicated concealed consequently consist content conventions coronet corporal crushed curious damages damp defend
degrees destined devotion douglas drainage dutch eldest electors employers enforce entrusted est exists factories
failing fee fetch fortnight fourteen furnish ganglion gloves gracious groom hastened heels hidden http ice icons
indicating indurated induration judicial kinds kremlin largely lofty manifest marching militiamen milk minor motor
names obey offensive outer ownership passions perplexity philippines profits pulling purple radical radiogram rang
reasonable rebellion require retire rostova rubber severely sheet shevardino shinshin shop simultaneously stated
stepping toll transport travel ultimately uncommon unconsciously waved webster willarski withdraw abnormal abundant
accident advised agreeable allied aloud anterior antiseptic arise arrive astonishment birth bowing brave calmly canada
candidates candles charged chicago citizen coarse collective conquest consequence constitutes contracture creature
destructive discover distal doses drops exaggerated exchanged extends favourable furnished gaze giant goal gross
halted hid infinite ix kansas killing loaded luck margin mason massage medullary meetings midnight missed missing
myeloma neighbor neighbors net picture pieces pillow placing products professional purse release render replying
representation reputation rested restore restricted rows schools sebaceous seconds servitude softened sovereignty
stirred subsequent supremacy sustained sutures swayed theodore uhlans visited whistle wouldn xi xii xiv abandoning
activities add amused aorta arbitration bands boundary chondroma clair clinically coldly collection commonest
contemporaries convoy cook crying deformities delayed description disputes dokhturov dragoons dresses effective
element embedded empress encounter endure experiment extremities farmer faster fix flap flowed forgot fourteenth funds
gravity greeted hampshire harness highroad horrible hunger improvements incident indefinite indiana involuntary kaluga
kings lake lane laying lee liability lieutenant locked lumen machinery manage medicine minds mountains naevus negative
negroes perform pink plantations poisoning pretext printed probable pyaemia questioning resulted runs shortly sleeve
spare stable studies submitted sunk teach thickening tooth trembled upstairs vols wagon wake wept whistling writers
adherent adults anaesthetic avenue battalions beast bench bond carotid cartilaginous catherine clothing coach
comparison contain conveyed copies copper corporations corresponding cunning cup danced dealt decline depression
dismounted displacement distribute downstairs dried easier energetic envelope eternal exact favour flesh furniture
gerasim glances heroic homestead impaired india indifference inn irony italy key kingdom knocked losses lover marshals
mavra mob nephew oath occupations oedematous org outline overcoat pacing painfully patience platon poland pool pounds
poverty prayed projects punish ratified reckoned recorded resembles resolutions resting revolt robert roll route row
samuel secession sees sentence shots slender snuffbox solitary subsequently substances suspected text thee thereof
threatening throne tourniquet turns upset vexation wave whitlow zone abolished accumulation advertisement agent
annexation answers aseptic attacking backward bar beausset belonging bezukhova brief bryan cadet characterised cher
childish clerk commanded completed complex conducted conferred conscience consisting constitute construction
convenient cruelty custom damage declare depended deposit desert differently discipline discovery distress dose drank
duration edinburgh embolism en endless ensues epiphysial excess explaining fairly falls finance formidable fun funny
gossip gouty harrison hatred heroes hosmer hum ideal ilagin implicated independently inflicted injections instances
intervention investigation joyous jury largest larynx lest ligaments lymphatic measured messenger mozhaysk naive naked
narrative occurring originate overgrowth pen porter porto positions procedure propose prosperity protested punctured
records regarding relative relieved remedy reminded repeat rheumatism rickets roar rodent rubbing sale saline sallow
scalp scheme scoundrel select shared signal slightest sobbing speaker successfully sufferings suit theater thinks
thoracic trading troubles turner uncomfortable vividly weep willing wisdom zeal absurd accordingly adenoma adult
africa aims amusing applicable artisans assure atlantic attributed awake barrier bees behalf bier bundles capillary
caries charleston childlike chinese christmas circular circumscribed coffee collect colored comrade continues
correspondence countrymen courier creating crop crops crush curly decisive definition dermoids detected dilated dim
eating eighteen elapsed elbows elsewhere employment enable encouraged englishman enjoy expansion factors factory fed
fence feverish fibromatosis fleet folded freehold golden gradual grateful greatness greeting guide hiding hoofs hoping
huntsman hurrying impending impressed improved infants infections infiltration intestine jacksonian jones kuzminichna
lesser lining located majestic marched mechanics median membranes merit mistress moon moves nebraska needles neuroma
nowhere occasional occupy offering openly panama precisely prepuce profit proprietary qualities radiant regret
reluctantly remarkably repeal repeatedly retreating rhetor rico rises root roused scott settlements sheep slip smart
smilingly stake star stared strangely subtle suction suggest suggestion surely surrendered tear tent terminal thrombus
ties tiptoe unconscious undertaking vereshchagin vigorously vodka weaker weapon widespread wisconsin wise xv abuses
admitting affectionate alleged anaesthesia appearing applications assemblies atmosphere attractive audible bay belong
blind burke buttock callender celebrated competition cords creditors dashed defect defects deliberately delightful
delivered dimly drift drinking economy emancipation examples fatty favorable finds fitted flames flexor fog fold
followers fox framework frankly frown gigantic heights hitherto honest host hostility incised index induce influences
introduce irrigation knights lime limits linen longed lungs lymphangitis madam michigan muttering nationalism neuro
opium opponent orange originates partial pas passionately plenty preoccupied prescribed produces promptly pull pursuit
questioned recollection recourse reflection reformers remembering representing respectful respiration restrictions
rice routine rumors sharing shout sin sloughs solemnly sorts spasms spurs stain standards stolen stump sub taste tense
traces trained transformed treason washed washing waste whence wherever wire wolzogen wretched abdomen accompany
acquainted adding adoption agricultural allies angioma appreciated attendance audience avoiding bath bind bite blister
blocking boot brachial catgut cellar checked circulating claimed clavichord coin comfortable commons critical crushing
curtain daring dawn defended depths desires destiny diphtheria downwards dragging drissa duct efficient eighteenth
embarrassed empereur ensue erosion establishing examine extra exudate file foreigners foreseen foundations francis
functions generations gets gloom glow habitual harsh helpless hoarse honored horizon hotel inoculation inserted
instinct invisible involve irresistible ivanovna jealous johnson krasnoe laborers lately layers ligament lights mack
manhood manners medical merrily michaud mines minimum monarch morrow muskets negro nights nineteenth nominated nursery
olmutz parted passes patriotic perished permitted physically pictures pole posts prison profession promoted providence
qualifications radial rage realm rectum respected respects rigid rolling ryazan sailors scapula scarlet shawl shops
sincere spongy swellings sympathetic tearing temple terribly tightly traffic treating trot verses volunteers voted
waistcoat wax welcomed witnessed woods xiii afforded amiable announcement anybody arterio asks aspects ate bag
bandaged beating blockade bluish bosom boys breach breeches brow bruised brushed buried campaigns carpet centers
collateral coloured commissions committees community compact congestion congratulate constructed contracted
cooperation crimes decree defective defending demonstrated differential dispatch displaced dissolution drastic drug
drunken edition educated effected eighth eighty electric eleven enforcement enjoyment entry equipment etc exclusively
expenses fears finishing fish fitting flourishing foe formal fortunate fragments fulfilled fundamental grace grants
guessed handle happily harmful hated heel hendrikhovna hit hive honorable impulse inclined inconvenience indolent
influenced initiative inquiries inquiring institution instruments interstate involves isolated japan judging justify
kidney lent lessons logical loves maine maneuvers manufacturers maximum memorable minded modified monarchy museum
musketry nasal neuritis newspaper niece niemen observing ogg paraffin pardon perish phalanx phase pose posted prefer
presidency projecting pronounced properly protected punished punishment raevski rapturous recalling reduce reduction
relate replacement requirements response resumed roylott sacred samovar scraped seats security sherman shipping shy
sinking skilled slope smith somebody splints stepfather straw strengthen sunshine supposing suspicion symptom tale
taught temporarily tenure theories thyreoid trains tranquil transmitted transportation treaties trousers twisted
typhoid upwards utah utterly vehicles vested vexed viewed void warmly web wheel wrinkled yielding accidentally afford
analysis annual anthrax anxiously approve arkansas atrophy balaga bismuth bleed cares chase choosing clavicle
complaint compound contained continuing continuity contradiction conversations counted courtiers crack dearest deprive
determination disability disliked dismay distorted divisions document dorsum electoral elevated encourage epiphysis
excised eyed fails faithful fearing feather firmness fleches florida flowing foolish forbidden forbidding foul
freemasonry fruit fulfill gains gathering generous governed gratitude halt hate hesitation hostess impairment
impressions improve incessantly intact intelligent intentions interfered invariably iowa lively log loyal mentally
miloradovich mutual neighboring novel odour operate opposing orbit osseous osteoma overthrow owe pad paine panic
parade pavlograd permanently persist pick pilgrims plea plexus pond pour profuse proves puckered purely puritans queen
readiness recurrent redness refrain reins relapse reliable relieve resolutely responded rivers ruler rushing san
sciatic secondly seventy sincerely sleepy slipping spoils stiff struggling stuck subclavian submission sums
supervision suvorov tells thoughtful tiny traitor transfer traveling trophic turkey vainly valves vertebrae vyazma
wash wasted windibank woke writes www abbe abolitionists advise afterward aimed allowing alteration amendments
announce arbitrary architect aren arranging astonished attract austrians avail awoke beaming behave beloved beneficial
benjamin birch briskly brotherhood buildings bureau calculated caps cautery charcot civilian`
  .trim()
  .split(/\s+/)

const DOMAIN_SPELLING_WORDS = [
  "mbali",
  "mbalis",
  "dyobiso",
  "dyobisoentle",
  "klerksdorp",
  "welkom",
  "vanderbijlpark",
  "milner",
  "educators",
  "helen",
  "dominics",
  "nwu",
  "nwus",
  "bsc",
  "hcl",
  "hcls",
  "unilift",
  "bursary",
  "bursaries",
  "matric",
  "matriculated",
  "cybersecurity",
  "fullstack",
  "frontend",
  "backend",
  "database",
  "databases",
  "javascript",
  "typescript",
  "nextjs",
  "nodejs",
  "expressjs",
  "mysql",
  "mongodb",
  "github",
  "restful",
  "api",
  "apis",
  "vlan",
  "vlans",
  "dhcp",
  "nat",
  "acl",
  "acls",
  "asa",
  "ssh",
  "networking",
  "software",
  "developer",
  "development",
  "technology",
  "technologies",
  "qualification",
  "competencies",
  "adaptability",
  "collaboration",
  "programme",
  "programmes",
  "internship",
  "internships",
  "graduate",
  "graduates",
  "portfolio",
  "repositories",
]

const COMMON_TYPO_CORRECTIONS: Record<string, string> = {
  abotu: "about",
  adn: "and",
  agian: "again",
  alot: "a lot",
  alwasy: "always",
  alredy: "already",
  amke: "make",
  anoter: "another",
  anwser: "answer",
  asnwer: "answer",
  asnwers: "answers",
  askd: "asked",
  becasue: "because",
  becuase: "because",
  beter: "better",
  borth: "birth",
  bursay: "bursary",
  bursry: "bursary",
  cant: "cannot",
  cna: "can",
  cnat: "cannot",
  compelete: "complete",
  complet: "complete",
  completly: "completely",
  completd: "completed",
  conatct: "contact",
  corse: "course",
  coures: "course",
  cours: "course",
  curren: "current",
  databse: "database",
  defintely: "definitely",
  degre: "degree",
  detsial: "details",
  didnt: "did not",
  diffrent: "different",
  doens: "does",
  doenst: "does not",
  doesent: "does not",
  doesnt: "does not",
  doign: "doing",
  dont: "do not",
  eductaion: "education",
  emial: "email",
  exmaple: "example",
  expereince: "experience",
  experince: "experience",
  frm: "from",
  fro: "from",
  fundd: "funded",
  fundded: "funded",
  gradute: "graduate",
  graduatoin: "graduation",
  hcll: "hcl",
  hig: "high",
  hihg: "high",
  hwo: "how",
  hw: "how",
  infom: "information",
  infromation: "information",
  isnt: "is not",
  knwo: "know",
  knowlege: "knowledge",
  knwledge: "knowledge",
  liv: "live",
  lve: "live",
  mabli: "mbali",
  mablie: "mbali",
  matirc: "matric",
  matricualted: "matriculated",
  mroe: "more",
  nad: "and",
  ned: "need",
  neeed: "need",
  netwrok: "network",
  nto: "not",
  ot: "to",
  pase: "pass",
  possibe: "possible",
  prefered: "preferred",
  primery: "primary",
  proejct: "project",
  proejcts: "projects",
  quesion: "question",
  quesions: "questions",
  skils: "skills",
  skilss: "skills",
  qustion: "question",
  recieve: "receive",
  recieved: "received",
  recived: "received",
  rember: "remember",
  sames: "same",
  schhol: "school",
  scholl: "school",
  scool: "school",
  secodnary: "secondary",
  shcool: "school",
  shee: "she",
  shes: "she is",
  softwrae: "software",
  strenght: "strength",
  strenghts: "strengths",
  studing: "studying",
  studys: "studies",
  studeis: "studies",
  studnet: "student",
  studnets: "students",
  stundent: "student",
  tehnology: "technology",
  tecnology: "technology",
  technlogy: "technology",
  technlogies: "technologies",
  techologies: "technologies",
  teh: "the",
  tehr: "there",
  tehre: "there",
  thier: "their",
  thsi: "this",
  tihs: "this",
  univercity: "university",
  univeristy: "university",
  universty: "university",
  whta: "what",
  waht: "what",
  wat: "what",
  wht: "what",
  wher: "where",
  whre: "where",
  wich: "which",
  wihch: "which",
  wont: "will not",
  yow: "you",
  ypu: "you",
  yu: "you",
  whats: "what is",
  wheres: "where is",
  whos: "who is",
  hows: "how is",
}

const SPELLING_PROTECTED_WORDS = new Set([
  ...DOMAIN_SPELLING_WORDS,
  "c++",
  "c#",
  "node.js",
  "next.js",
  "express.js",
  "react.js",
  "north-west",
  "self-funded",
])

const SPELLING_VOCABULARY = [
  ...new Set([...COMMON_SPELLING_WORDS, ...DOMAIN_SPELLING_WORDS]),
]

const SPELLING_WORD_RANK = new Map(
  SPELLING_VOCABULARY.map((word, index) => [word, index]),
)

const SPELLING_WORDS_BY_LENGTH = SPELLING_VOCABULARY.reduce(
  (buckets, word) => {
    const wordsForLength = buckets.get(word.length) ?? []
    wordsForLength.push(word)
    buckets.set(word.length, wordsForLength)
    return buckets
  },
  new Map<number, string[]>(),
)

const CHAT_SPELLING_PHRASE_RULES: Array<[RegExp, string]> = [
  [/\bwhere (is|was) (mbali|she) form\b/g, "where $1 $2 from"],
  [/\bwhere does (mbali|she) come form\b/g, "where does $1 come from"],
  [/\b(come|comes|came) form\b/g, "$1 from"],
  [/\bwhat dose (mbali|she) do\b/g, "what does $1 do"],
  [/\bhow olds? (is|was) (mbali|she)\b/g, "how old $1 $2"],
  [/\bwhich corse\b/g, "which course"],
  [/\bwhat corse\b/g, "what course"],
]

function damerauLevenshteinDistance(first: string, second: string) {
  const rows = first.length + 1
  const columns = second.length + 1
  const matrix = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0),
  )

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost =
        first[row - 1] === second[column - 1] ? 0 : 1

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      )

      if (
        row > 1 &&
        column > 1 &&
        first[row - 1] === second[column - 2] &&
        first[row - 2] === second[column - 1]
      ) {
        matrix[row][column] = Math.min(
          matrix[row][column],
          matrix[row - 2][column - 2] + 1,
        )
      }
    }
  }

  return matrix[first.length][second.length]
}

const findBestSpellingCorrection = (token: string) => {
  const directCorrection = COMMON_TYPO_CORRECTIONS[token]

  if (directCorrection) {
    return directCorrection
  }

  if (
    SPELLING_PROTECTED_WORDS.has(token) ||
    SPELLING_WORD_RANK.has(token) ||
    !/^[a-z]+$/.test(token) ||
    token.length < 4
  ) {
    return token
  }

  const maxDistance = token.length >= 7 ? 2 : 1
  let bestWord = token
  let bestDistance = maxDistance + 1
  let bestRank = Number.POSITIVE_INFINITY
  let bestStartsTheSame = false
  let bestEndsTheSame = false

  for (
    let candidateLength = Math.max(2, token.length - maxDistance);
    candidateLength <= token.length + maxDistance;
    candidateLength += 1
  ) {
    const candidates = SPELLING_WORDS_BY_LENGTH.get(candidateLength) ?? []

    for (const candidate of candidates) {
      const distance = damerauLevenshteinDistance(token, candidate)

      if (distance > maxDistance) {
        continue
      }

      const rank = SPELLING_WORD_RANK.get(candidate) ?? Number.POSITIVE_INFINITY
      const startsTheSame = token[0] === candidate[0]
      const endsTheSame = token[token.length - 1] === candidate[candidate.length - 1]

      const isBetter =
        distance < bestDistance ||
        (distance === bestDistance && startsTheSame && !bestStartsTheSame) ||
        (distance === bestDistance && startsTheSame === bestStartsTheSame && endsTheSame && !bestEndsTheSame) ||
        (distance === bestDistance &&
          startsTheSame === bestStartsTheSame &&
          endsTheSame === bestEndsTheSame &&
          rank < bestRank)

      if (isBetter) {
        bestWord = candidate
        bestDistance = distance
        bestRank = rank
        bestStartsTheSame = startsTheSame
        bestEndsTheSame = endsTheSame
      }
    }
  }

  if (bestWord === token) {
    return token
  }

  // Distance-two corrections are intentionally conservative so that an
  // unfamiliar name is less likely to be changed into an unrelated word.
  if (
    bestDistance === 2 &&
    token.length < 7
  ) {
    return token
  }

  if (
    bestDistance === 2 &&
    !bestStartsTheSame &&
    !bestEndsTheSame
  ) {
    return token
  }

  return bestWord
}

const correctSpellingInQuestion = (value: string) => {
  let correctedValue = value
    .split(/\s+/)
    .map((token) => findBestSpellingCorrection(token))
    .join(" ")

  CHAT_SPELLING_PHRASE_RULES.forEach(([pattern, replacement]) => {
    correctedValue = correctedValue.replace(pattern, replacement)
  })

  return correctedValue.replace(/\s+/g, " ").trim()
}


const normalizeChatQuestion = (value: string) => {
  let normalizedValue = value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9+#.\s-]/g, " ")

  normalizedValue = correctSpellingInQuestion(normalizedValue)

  CHAT_NORMALIZATION_RULES.forEach(([pattern, replacement]) => {
    normalizedValue = normalizedValue.replace(pattern, replacement)
  })

  return normalizedValue.replace(/\s+/g, " ").trim()
}

const levenshteinDistance = (first: string, second: string) => {
  const rows = second.length + 1
  const columns = first.length + 1
  const matrix = Array.from({ length: rows }, () => Array<number>(columns).fill(0))

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column
  }

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const substitutionCost =
        second[row - 1] === first[column - 1] ? 0 : 1

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      )
    }
  }

  return matrix[rows - 1][columns - 1]
}

const fuzzyTokenMatch = (questionToken: string, keywordToken: string) => {
  if (questionToken === keywordToken) {
    return true
  }

  if (questionToken.length < 4 || keywordToken.length < 4) {
    return false
  }

  const allowedDistance = Math.max(questionToken.length, keywordToken.length) >= 8 ? 2 : 1
  return levenshteinDistance(questionToken, keywordToken) <= allowedDistance
}

const stableAnswerIndex = (value: string, length: number) => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return length === 0 ? 0 : hash % length
}

const knowledgeBase: KnowledgeIntent[] = [
  {
    id: "greeting",
    topic: "greeting",
    priority: 20,
    patterns: [
      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening",
      "how are you",
      "can you help me",
    ],
    keywords: ["hello", "hi", "hey", "help"],
    answers: [
      "Hello! I am Mbali's portfolio assistant. Ask me about her background, education, projects, technical skills, HCL Technology bursary, achievements, strengths, career interests or interview-related information.",
      "Hi! I can help you learn more about Mbali Dyobiso. You can ask about her academic journey, projects, technology stack, preferred IT roles, bursary, competencies or contact information.",
    ],
  },
  {
    id: "identity-summary",
    topic: "profile",
    priority: 10,
    patterns: [
      "tell me about mbali",
      "who is mbali",
      "introduce mbali",
      "give me a summary of mbali",
      "what can you tell me about her",
      "tell me about yourself",
      "professional summary",
      "profile summary",
      "brief introduction",
      "overview of mbali",
    ],
    keywords: ["about mbali", "who is", "introduce", "summary", "profile", "overview"],
    answers: [
      "Mbali Dyobiso is a BSc Information Technology student at North-West University's Vanderbijlpark Campus and is expected to complete her degree in November 2026. She has practical experience in full-stack development, RESTful APIs, databases, enterprise networking and cybersecurity fundamentals. She is adaptable, collaborative and motivated to begin her career through a graduate, internship or junior IT opportunity.",
      "Mbali is an emerging IT professional with a foundation in software development, systems design, databases and networking. Her portfolio includes a full-stack student transportation system and a secure enterprise network design. She is interested in opportunities where she can contribute, learn from experienced professionals and continue developing reliable, user-focused technology solutions.",
      "Mbali Dyobiso is a South African BSc IT student who combines academic knowledge with practical project work. Her strengths include problem-solving, adaptability, communication, teamwork and continuous learning. She is especially interested in software development, backend systems, networking and cybersecurity-related career paths.",
    ],
  },
  {
    id: "birth-date-age",
    topic: "personal history",
    patterns: [
      "how old is mbali",
      "what is her age",
      "when was she born",
      "what is her date of birth",
      "when is her birthday",
      "birthday of mbali",
    ],
    keywords: ["age", "birthday", "born", "date of birth", "28 september 2004"],
    answers: [
      "Mbali was born on 28 September 2004. Her age can be calculated from that date.",
      "Her date of birth is 28 September 2004.",
    ],
  },
  {
    id: "birthplace",
    topic: "personal history",
    patterns: [
      "where was she born",
      "where is mbali from originally",
      "what is her birthplace",
      "which hospital was she born in",
      "was she born in east london",
    ],
    keywords: ["birthplace", "east london", "eastern cape", "st dominics hospital", "hospital"],
    answers: [
      "Mbali was born in East London in the Eastern Cape at St Dominic's Hospital on 28 September 2004.",
      "She was born at St Dominic's Hospital in East London, Eastern Cape.",
    ],
  },
  {
    id: "childhood-moves",
    topic: "personal history",
    patterns: [
      "where did she grow up",
      "tell me about her childhood",
      "where has she lived",
      "when did she move to welkom",
      "when did she move to klerksdorp",
      "describe her early life",
    ],
    keywords: ["childhood", "grew up", "moved", "welkom", "klerksdorp", "east london"],
    answers: [
      "Mbali was born in East London. When she was five years old, she moved to Welkom in the Free State. She later moved to Klerksdorp in the North West, where she continued her schooling and is currently based.",
      "Her early life included living in three provinces: she was born in East London in the Eastern Cape, moved to Welkom in the Free State at age five, and later settled in Klerksdorp in the North West.",
    ],
  },
  {
    id: "family",
    topic: "personal history",
    patterns: [
      "tell me about her family",
      "does she have siblings",
      "how many siblings does she have",
      "what is her family background",
      "are her parents alive",
      "what household did she grow up in",
    ],
    keywords: ["family", "siblings", "brother", "sister", "parents", "household"],
    answers: [
      "Mbali has two siblings and grew up in a two-parent household. Both of her parents are still alive.",
      "Her family background includes two siblings and a two-parent household.",
    ],
  },
  {
    id: "primary-school-overview",
    topic: "school history",
    patterns: [
      "where did she attend primary school",
      "tell me about her primary education",
      "which primary schools did she attend",
      "primary school history",
      "grades one to seven",
    ],
    keywords: ["primary school", "st helen", "educators school", "grade 1", "grade 7"],
    answers: [
      "Mbali attended St Helen Primary School in Welkom from Grade 1 to Grade 4 between 2011 and 2014. After moving to Klerksdorp, she completed Grade 5 to Grade 7 at Educators School from 2015 to 2017.",
      "Her primary education was split between St Helen Primary School in Welkom for Grades 1–4 and Educators School in Klerksdorp for Grades 5–7.",
    ],
  },
  {
    id: "st-helens",
    topic: "school history",
    patterns: [
      "when did she attend st helen",
      "what grades did she complete at st helen",
      "st helen primary school",
    ],
    keywords: ["st helen", "2011", "2014", "grade 1", "grade 4", "welkom"],
    answers: [
      "Mbali attended St Helen Primary School in Welkom from Grade 1 to Grade 4, covering the years 2011 to 2014.",
    ],
  },
  {
    id: "educators-school",
    topic: "school history",
    patterns: [
      "when did she attend educators school",
      "what grades did she complete at educators school",
      "educators school",
    ],
    keywords: ["educators school", "2015", "2017", "grade 5", "grade 7", "klerksdorp"],
    answers: [
      "After moving to Klerksdorp, Mbali attended Educators School from Grade 5 to Grade 7 between 2015 and 2017.",
    ],
  },
  {
    id: "high-school",
    topic: "school history",
    patterns: [
      "where did she attend high school",
      "which high school did she go to",
      "tell me about milner high school",
      "when was she at milner",
      "high school history",
    ],
    keywords: ["high school", "milner", "2018", "2022", "matric"],
    answers: [
      "Mbali attended Milner High School from 2018 to 2022 and completed her initial matric year there in 2022.",
      "Her high school education took place at Milner High School between 2018 and 2022.",
    ],
  },
  {
    id: "matric-journey",
    topic: "school history",
    patterns: [
      "what happened with her matric",
      "why did she redo matric",
      "did she repeat matric",
      "what pass did she get in 2022",
      "what pass did she get in 2023",
      "diploma pass and bachelor pass",
      "explain her matric results",
    ],
    keywords: ["matric", "diploma pass", "bachelor pass", "redo", "repeat", "2022", "2023"],
    answers: [
      "Mbali matriculated in 2022 with a Diploma pass. She chose to repeat her matric year in 2023 and improved her result to a Bachelor's pass, which enabled her to pursue university studies.",
      "Her matric journey demonstrates persistence: after earning a Diploma pass in 2022, she redid matric in 2023 and achieved a Bachelor's pass.",
      "She completed matric in 2022 with a Diploma pass, then returned in 2023 to improve her results and obtained a Bachelor's pass.",
    ],
  },
  {
    id: "education-timeline",
    topic: "education",
    patterns: [
      "give me her education timeline",
      "summarise her education history",
      "what is her academic journey",
      "take me through her schooling",
      "education background",
      "academic background",
    ],
    keywords: ["education timeline", "academic journey", "schooling", "education history", "background"],
    answers: [
      "Mbali attended St Helen Primary School from 2011–2014, Educators School from 2015–2017 and Milner High School from 2018–2022. She improved her matric result in 2023 from a Diploma pass to a Bachelor's pass. In 2024, she began a BSc in Information Technology at North-West University's Vanderbijlpark Campus and expects to complete it in November 2026.",
      "Her academic journey progressed from primary school in Welkom and Klerksdorp, to Milner High School, a successful matric improvement year in 2023, and then admission to the BSc Information Technology programme at NWU in 2024.",
    ],
  },
  {
    id: "university-admission",
    topic: "education",
    patterns: [
      "when was she accepted to university",
      "how did she get into university",
      "when did she start at nwu",
      "when did she begin university",
      "university admission",
    ],
    keywords: ["accepted", "admission", "started university", "2024", "nwu"],
    answers: [
      "After improving her matric result to a Bachelor's pass in 2023, Mbali was accepted into North-West University's BSc Information Technology programme and started at the Vanderbijlpark Campus in 2024.",
      "She began her university studies at North-West University in 2024 after earning a Bachelor's pass in her 2023 matric improvement year.",
    ],
  },
  {
    id: "degree",
    topic: "education",
    patterns: [
      "what degree is she studying",
      "what course does she do",
      "what qualification is she completing",
      "what does she study at nwu",
      "is she studying information technology",
    ],
    keywords: ["degree", "qualification", "bsc", "information technology", "nwu", "course"],
    answers: [
      "Mbali is completing a Bachelor of Science in Information Technology at North-West University's Vanderbijlpark Campus.",
      "Her current qualification is a BSc in Information Technology at NWU.",
    ],
  },
  {
    id: "graduation",
    topic: "education",
    patterns: [
      "when will she graduate",
      "when does she finish her degree",
      "expected completion date",
      "when is she completing university",
      "graduating when",
    ],
    keywords: ["graduate", "graduation", "complete", "completion", "november 2026", "finish degree"],
    answers: [
      "Mbali is expected to complete her BSc Information Technology degree in November 2026.",
      "Her expected degree completion date is November 2026.",
    ],
  },
  {
    id: "academic-foundation",
    topic: "education",
    patterns: [
      "what has she learned in her degree",
      "what is her academic foundation",
      "what areas does her degree cover",
      "what knowledge has university given her",
    ],
    keywords: ["academic foundation", "degree covers", "studies", "software development", "systems design", "networking", "databases"],
    answers: [
      "Her BSc IT studies have developed a foundation in software development, systems design, databases, backend logic, networking and user-focused application development.",
      "University has equipped Mbali with knowledge across programming, frontend and backend development, RESTful APIs, database systems, networking and secure system design.",
    ],
  },
  {
    id: "self-funded",
    topic: "funding",
    patterns: [
      "was she self funded",
      "who paid for her first year",
      "how was her first year funded",
      "did she pay for university herself",
    ],
    keywords: ["self funded", "self-funded", "first year", "2024", "funding"],
    answers: [
      "Mbali was self-funded during her first year of university in 2024.",
      "Her 2024 first year was funded privately before she received the HCL Technology bursary.",
    ],
  },
  {
    id: "hcl-bursary",
    topic: "funding",
    patterns: [
      "tell me about her hcl bursary",
      "who funds her studies now",
      "did she receive a bursary",
      "what bursary does she have",
      "how many students received the bursary",
      "is hcl still funding her",
    ],
    keywords: ["hcl", "hcl technology", "bursary", "five students", "funding", "2025", "2026"],
    answers: [
      "In 2025, Mbali was selected as one of five students to receive a bursary from HCL Technology. The bursary continued funding her studies in 2026.",
      "After self-funding her first year, Mbali became one of only five students awarded an HCL Technology bursary in 2025, and that support continues through 2026.",
      "Mbali's current study funding comes from an HCL Technology bursary awarded in 2025. She was one of five selected students.",
    ],
  },
  {
    id: "bursary-significance",
    topic: "funding",
    patterns: [
      "what does the bursary achievement show",
      "why is the hcl bursary important",
      "what is significant about her bursary",
      "what does being selected show",
    ],
    keywords: ["bursary achievement", "selected", "significance", "five students", "hcl"],
    answers: [
      "Being selected as one of five HCL Technology bursary recipients reflects Mbali's academic potential, perseverance and ability to stand out among other students. It also gave her continued financial support while completing her degree.",
      "The HCL bursary is significant because it followed a self-funded first year and recognised her potential strongly enough for continued support in 2025 and 2026.",
    ],
  },
  {
    id: "achievements",
    topic: "achievements",
    patterns: [
      "what are her achievements",
      "tell me about her accomplishments",
      "what has she achieved",
      "does she have certificates",
      "what certification does she have",
    ],
    keywords: ["achievement", "accomplishment", "certificate", "certification", "cybersecurity", "bursary"],
    answers: [
      "Mbali earned an Introduction to Cybersecurity Certificate from Cisco Networking Academy in 2025. She was also selected as one of five students to receive an HCL Technology bursary in 2025, which continues to support her studies in 2026.",
      "Her highlighted achievements include a Cisco Networking Academy Introduction to Cybersecurity Certificate and selection for the HCL Technology bursary after self-funding her first university year.",
    ],
  },
  {
    id: "core-competencies",
    topic: "competencies",
    patterns: [
      "what are her core competencies",
      "what are her soft skills",
      "which personal skills does she have",
      "what professional qualities does she have",
      "what are her non technical skills",
    ],
    keywords: ["core competencies", "personal skills", "qualities", "adaptability", "time management", "team collaboration", "communication", "problem-solving", "continuous learning"],
    answers: [
      "Mbali's core competencies are adaptability, time management, team collaboration, communication, problem-solving and continuous learning.",
      "Her professional strengths include adapting to change, managing time, collaborating with others, communicating clearly, solving problems methodically and continuously improving her knowledge.",
    ],
  },
  {
    id: "adaptability",
    topic: "competencies",
    patterns: [
      "is she adaptable",
      "give an example of adaptability",
      "how does she handle change",
      "how has she adapted",
    ],
    keywords: ["adaptability", "adaptable", "change", "adjust"],
    answers: [
      "Mbali's academic path demonstrates adaptability. She adjusted to different cities and schools, returned to improve her matric result, transitioned into university and has learned across both software and networking disciplines.",
      "A strong example of her adaptability is her decision to redo matric in 2023, improve from a Diploma pass to a Bachelor's pass and then successfully transition into a BSc IT programme.",
    ],
  },
  {
    id: "time-management",
    topic: "competencies",
    patterns: [
      "how are her time management skills",
      "can she manage deadlines",
      "how does she organise her work",
      "time management example",
    ],
    keywords: ["time management", "deadlines", "organise", "prioritise", "schedule"],
    answers: [
      "Her studies and technical projects require balancing coursework, development tasks, testing and documentation. A suitable interview explanation is that she breaks work into smaller tasks, prioritises deadlines and tracks progress so that important deliverables are completed on time.",
      "Mbali approaches time management by planning tasks, prioritising according to deadlines and completing complex work in manageable stages.",
    ],
  },
  {
    id: "teamwork",
    topic: "competencies",
    patterns: [
      "can she work in a team",
      "how is she at teamwork",
      "tell me about team collaboration",
      "does she collaborate well",
      "teamwork interview answer",
    ],
    keywords: ["teamwork", "team collaboration", "collaborate", "team", "group work"],
    answers: [
      "Mbali values clear communication, shared responsibility and respect for different ideas. In a team environment, she is prepared to ask questions, complete her assigned work, support others and use feedback to improve the final result.",
      "Her team approach is collaborative and responsible: she communicates progress, listens to teammates, contributes technical ideas and keeps the shared goal in focus.",
    ],
  },
  {
    id: "communication",
    topic: "competencies",
    patterns: [
      "how are her communication skills",
      "can she explain technical ideas",
      "how does she communicate",
      "communication interview answer",
    ],
    keywords: ["communication", "communicate", "explain", "listen", "presentation"],
    answers: [
      "Mbali's communication style is clear, respectful and open to feedback. She aims to explain technical work in understandable terms, confirm requirements and keep teammates informed about progress or challenges.",
      "She understands that good IT work requires both technical ability and clear communication with users, teammates and supervisors.",
    ],
  },
  {
    id: "problem-solving",
    topic: "competencies",
    patterns: [
      "how does she solve problems",
      "is she a problem solver",
      "what is her problem solving approach",
      "give a problem solving example",
      "how does she handle technical issues",
    ],
    keywords: ["problem-solving", "problem solving", "solve", "technical issue", "debug", "troubleshoot"],
    answers: [
      "Mbali uses a structured problem-solving process: understand the requirement, separate it into smaller parts, design a solution, test each part, identify errors and improve the result. Her UniLift and enterprise-network projects both required this kind of systematic thinking.",
      "Her approach is to investigate the cause, compare possible solutions, implement carefully and test the outcome instead of making unverified changes.",
    ],
  },
  {
    id: "continuous-learning",
    topic: "competencies",
    patterns: [
      "does she enjoy learning",
      "how does she keep learning",
      "is she a continuous learner",
      "how does she learn new technology",
      "what does continuous learning mean to her",
    ],
    keywords: ["continuous learning", "learn", "upskill", "new technology", "improve skills"],
    answers: [
      "Continuous learning is central to Mbali's career approach. She develops her knowledge through university modules, practical projects, technical experimentation, documentation and certifications such as Cisco's Introduction to Cybersecurity.",
      "She strengthens new skills by combining theory with hands-on practice, testing what she learns in projects and using feedback to refine her understanding.",
    ],
  },
  {
    id: "programming-languages",
    topic: "technical skills",
    patterns: [
      "which programming languages does she know",
      "what languages can she code in",
      "does she know java",
      "does she know python",
      "does she know c++",
      "does she know c#",
    ],
    keywords: ["programming languages", "java", "python", "c++", "c#", "coding languages"],
    answers: [
      "Mbali's programming-language knowledge includes Java, Python, C++ and C#. Her web-development work also uses JavaScript and TypeScript.",
      "She has experience with Java, Python, C++, C#, JavaScript and TypeScript across academic and portfolio work.",
    ],
  },
  {
    id: "frontend",
    topic: "technical skills",
    patterns: [
      "what frontend skills does she have",
      "can she do frontend development",
      "does she know react",
      "does she know nextjs",
      "what web technologies does she use",
    ],
    keywords: ["frontend", "html", "css", "javascript", "typescript", "react", "next.js", "nextjs"],
    answers: [
      "Her frontend stack includes HTML, CSS, JavaScript, TypeScript, React and Next.js. She uses these technologies to build responsive, user-focused interfaces.",
      "Mbali can work with modern frontend technologies including React and Next.js, supported by HTML, CSS, JavaScript and TypeScript.",
    ],
  },
  {
    id: "backend-api",
    topic: "technical skills",
    patterns: [
      "what backend skills does she have",
      "can she build apis",
      "does she know nodejs",
      "does she know express",
      "what is her backend stack",
      "can she do server side development",
    ],
    keywords: ["backend", "node.js", "nodejs", "express.js", "express", "restful api", "server side"],
    answers: [
      "Mbali's backend skills include Node.js, Express.js, RESTful API development, server-side logic, authentication workflows and integration with databases such as MySQL.",
      "She has practical backend experience using Node.js and RESTful APIs, particularly through the UniLift transportation-management project.",
    ],
  },
  {
    id: "rest-api",
    topic: "technical skills",
    patterns: [
      "what is her restful api experience",
      "has she worked with rest apis",
      "how did she use apis",
      "what does api development mean in her project",
    ],
    keywords: ["restful api", "rest api", "api development", "endpoints", "request", "response"],
    answers: [
      "In the UniLift project, RESTful APIs connected the user interface, server logic and MySQL database. They supported operations such as creating ride requests, reading data, updating ride statuses and managing drivers or vehicles.",
      "Her API experience includes designing and consuming server endpoints for CRUD operations, authentication-related flows and database-backed application features.",
    ],
  },
  {
    id: "databases",
    topic: "technical skills",
    patterns: [
      "what database skills does she have",
      "which databases does she know",
      "does she know mysql",
      "does she know oracle sql",
      "does she know mongodb",
      "can she manage data",
    ],
    keywords: ["database", "databases", "mysql", "oracle sql", "mongodb", "sql", "data management"],
    answers: [
      "Mbali's database skills include MySQL, Oracle SQL and MongoDB. She has used MySQL in a full-stack project to store and manage users, drivers, vehicles, transportation requests and ride information.",
      "She has experience with relational and NoSQL database technologies, including MySQL, Oracle SQL and MongoDB.",
    ],
  },
  {
    id: "networking",
    topic: "technical skills",
    patterns: [
      "what networking skills does she have",
      "can she design networks",
      "does she know vlans",
      "what does she know about routing",
      "network engineering skills",
    ],
    keywords: ["networking", "network engineering", "vlan", "routing", "dhcp", "nat", "acl", "ssh", "packet tracer"],
    answers: [
      "Her networking skills include VLAN design, inter-VLAN routing, DHCP, NAT, ACL configuration, SSH management, network segmentation, redundancy and Cisco Packet Tracer simulation.",
      "Mbali has designed a scalable enterprise network with routing, addressing, segmentation, remote administration and security controls.",
    ],
  },
  {
    id: "cybersecurity",
    topic: "technical skills",
    patterns: [
      "what cybersecurity knowledge does she have",
      "is she interested in cybersecurity",
      "what security skills does she have",
      "does she know network security",
      "cybersecurity experience",
    ],
    keywords: ["cybersecurity", "security", "asa firewall", "acl", "network segmentation", "cisco certificate"],
    answers: [
      "Mbali's cybersecurity foundation includes an Introduction to Cybersecurity Certificate from Cisco Networking Academy, plus practical exposure to ACLs, ASA firewalls, network segmentation, secure remote access and layered network controls.",
      "Her security knowledge is currently strongest in cybersecurity fundamentals and network security. She has applied firewalls, ACLs, segmentation and secure SSH management in her enterprise-network project.",
    ],
  },
  {
    id: "developer-tools",
    topic: "technical skills",
    patterns: [
      "which development tools does she use",
      "what tools is she familiar with",
      "does she use github",
      "which ide does she use",
      "what software tools does she know",
    ],
    keywords: ["developer tools", "github", "visual studio code", "vs code", "visual studio", "packet tracer", "ide"],
    answers: [
      "Her development tools include GitHub, Visual Studio Code, Visual Studio and Cisco Packet Tracer.",
      "Mbali uses GitHub for source-code repositories, VS Code and Visual Studio for development, and Cisco Packet Tracer for network design and simulation.",
    ],
  },
  {
    id: "complete-tech-stack",
    topic: "technical skills",
    patterns: [
      "what is her full tech stack",
      "list all her technical skills",
      "what technologies does she know",
      "give me a complete skills overview",
      "technical skills summary",
    ],
    keywords: ["tech stack", "technical skills", "technologies", "complete skills", "all skills"],
    answers: [
      "Mbali's technology stack includes Java, Python, C++, C#, HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express.js and RESTful APIs. She works with MySQL, Oracle SQL and MongoDB, and uses GitHub, VS Code, Visual Studio and Cisco Packet Tracer. Her networking knowledge includes VLANs, routing, DHCP, NAT, ACLs, ASA firewalls, SSH and segmentation.",
      "Her skills span programming, frontend development, backend APIs, databases, enterprise networking and cybersecurity fundamentals. This gives her a broad entry-level foundation for software, infrastructure and security-related roles.",
    ],
  },
  {
    id: "unilift-overview",
    topic: "projects",
    patterns: [
      "tell me about unilift",
      "what is the student transportation project",
      "describe her fullstack project",
      "what did she build for student transport",
      "unilift project overview",
    ],
    keywords: ["unilift", "student transportation", "ride requests", "transport management", "fullstack project"],
    answers: [
      "UniLift is a full-stack university transportation-management system developed by Mbali. Students can submit ride requests while administrators manage drivers, vehicles and transport requests. The system includes responsive dashboards, CRUD functionality, role-based authentication, ride-status updates and reporting.",
      "The UniLift project demonstrates Mbali's ability to connect a user interface, server-side logic, RESTful APIs and a MySQL database in one working system.",
    ],
  },
  {
    id: "unilift-features",
    topic: "projects",
    patterns: [
      "what features does unilift have",
      "what can users do in unilift",
      "how does unilift work",
      "what functionality did she build in unilift",
    ],
    keywords: ["unilift features", "crud", "authentication", "ride status", "reporting", "drivers", "vehicles"],
    answers: [
      "UniLift provides role-based access, ride-request creation, driver and vehicle management, transportation-request administration, status updates, reporting and responsive CRUD dashboards.",
      "Students use UniLift to request transport, while administrators manage the operational data and monitor ride progress through database-backed dashboards.",
    ],
  },
  {
    id: "unilift-technologies",
    topic: "projects",
    patterns: [
      "what technologies were used in unilift",
      "what is the unilift tech stack",
      "which database did unilift use",
      "what language was unilift built with",
    ],
    keywords: ["unilift technology", "node.js", "mysql", "javascript", "restful api"],
    answers: [
      "UniLift was built using Node.js, JavaScript, MySQL and RESTful APIs.",
      "The project's core stack combines Node.js backend logic, RESTful API communication and MySQL data storage, with JavaScript supporting the application experience.",
    ],
  },
  {
    id: "network-project-overview",
    topic: "projects",
    patterns: [
      "tell me about the office network project",
      "describe her network project",
      "what network did she design",
      "office network design and implementation",
      "enterprise network project",
    ],
    keywords: ["office network", "enterprise network", "packet tracer project", "network design", "collapsed core"],
    answers: [
      "Mbali designed and implemented a secure, scalable multi-department office network in Cisco Packet Tracer. The solution includes VLANs, inter-VLAN routing, DHCP, NAT, ACLs, ASA firewalls, redundancy, segmentation and SSH remote management.",
      "Her network project demonstrates enterprise-network planning, routing, secure segmentation, addressing, redundancy and layered security controls.",
    ],
  },
  {
    id: "network-project-security",
    topic: "projects",
    patterns: [
      "how did she secure the network",
      "what security controls were in the network project",
      "did the network use firewalls",
      "how was the office network protected",
    ],
    keywords: ["secure network", "asa firewall", "acl", "segmentation", "ssh", "security controls"],
    answers: [
      "The office network was protected through ASA firewalls, access-control lists, VLAN-based segmentation, secure SSH remote management and controlled routing between network areas.",
      "Its layered security design combined perimeter firewall controls, internal segmentation and ACL rules to reduce unnecessary access between departments and services.",
    ],
  },
  {
    id: "projects-overview",
    topic: "projects",
    patterns: [
      "what projects has she completed",
      "tell me about her projects",
      "what has she built",
      "show her project experience",
      "portfolio projects",
      "relevant academic projects",
    ],
    keywords: ["projects", "project experience", "built", "unilift", "office network"],
    answers: [
      "Mbali's featured projects are the UniLift Student Transportation Management System and an Office Network Design and Implementation project. Together they demonstrate full-stack development, database integration, API development, authentication, reporting, routing, segmentation and network security.",
      "Her portfolio currently highlights one software-development project and one enterprise-network project, showing both application-development and infrastructure skills.",
    ],
  },
  {
    id: "project-lessons",
    topic: "projects",
    patterns: [
      "what did she learn from her projects",
      "what skills did the projects develop",
      "what lessons did she gain",
      "how did her projects help her",
    ],
    keywords: ["project lessons", "learned", "skills gained", "experience gained"],
    answers: [
      "Her projects strengthened requirements analysis, problem decomposition, debugging, database integration, API design, authentication, network planning, security configuration, testing and technical documentation.",
      "The projects taught her how different components must work together: users, interfaces, server logic and databases in software; and addressing, routing, segmentation, redundancy and security in networks.",
    ],
  },
  {
    id: "preferred-it-fields",
    topic: "career interests",
    patterns: [
      "which it fields interest her",
      "what field in it does she prefer",
      "what area of technology does she like",
      "which career path suits her",
      "what does she want to specialise in",
      "what type of it work does she enjoy",
    ],
    keywords: ["preferred field", "it field", "career path", "area of interest", "specialise", "role preference"],
    answers: [
      "Based on her projects and skills, Mbali is most interested in software development, full-stack and backend development, database-backed systems, network engineering and cybersecurity. She is open to graduate or junior roles that provide hands-on learning and mentorship.",
      "Her strongest career-fit areas are software engineering, backend development, IT systems, network engineering and entry-level cybersecurity. She would also be comfortable in a broad technology graduate programme that rotates across technical teams.",
      "Mbali's portfolio supports several paths: application development through UniLift, backend and database work through Node.js and MySQL, and networking or cybersecurity through her Cisco-based enterprise-network project.",
    ],
  },
  {
    id: "software-development-interest",
    topic: "career interests",
    patterns: [
      "does she want to be a software developer",
      "is she interested in software engineering",
      "why does software development suit her",
      "would she enjoy application development",
    ],
    keywords: ["software developer", "software engineering", "application development", "build software"],
    answers: [
      "Software development suits Mbali because she enjoys turning requirements into practical, user-focused systems. Her UniLift project shows experience combining interfaces, backend logic, APIs and databases.",
      "She is interested in software-development opportunities where she can build reliable applications, improve her coding practices and learn from an experienced engineering team.",
    ],
  },
  {
    id: "backend-fullstack-interest",
    topic: "career interests",
    patterns: [
      "would she prefer backend or fullstack",
      "is backend development suitable for her",
      "is she interested in fullstack development",
      "what developer role fits her",
    ],
    keywords: ["backend role", "fullstack", "full-stack", "server side", "developer role"],
    answers: [
      "Backend or full-stack development would suit Mbali because she has worked with Node.js, RESTful APIs, MySQL, authentication and CRUD workflows, while also understanding frontend technologies such as React and Next.js.",
      "She has a broad enough foundation for a junior full-stack role, with a particular opportunity to deepen her backend, API and database skills.",
    ],
  },
  {
    id: "network-cyber-interest",
    topic: "career interests",
    patterns: [
      "would networking suit her",
      "is cybersecurity a good field for her",
      "could she work in network engineering",
      "is she interested in security roles",
    ],
    keywords: ["network role", "network engineering", "cybersecurity role", "security career", "infrastructure"],
    answers: [
      "Networking and cybersecurity are realistic career paths for Mbali because she has hands-on Packet Tracer experience with VLANs, routing, DHCP, NAT, ACLs, ASA firewalls, segmentation and secure remote management.",
      "An entry-level network, infrastructure or cybersecurity graduate role would align well with her enterprise-network project and Cisco cybersecurity certificate.",
    ],
  },
  {
    id: "database-interest",
    topic: "career interests",
    patterns: [
      "is she interested in databases",
      "could she work with database systems",
      "does database development suit her",
      "what data skills does she have",
    ],
    keywords: ["database career", "database systems", "data skills", "sql", "mysql"],
    answers: [
      "Mbali is comfortable with database-backed systems and has exposure to MySQL, Oracle SQL and MongoDB. A junior application, backend or database-support role could help her deepen data modelling, querying and database administration skills.",
      "Her strongest demonstrated database experience is integrating MySQL into the UniLift full-stack system, supported by academic knowledge of Oracle SQL and MongoDB.",
    ],
  },
  {
    id: "why-it",
    topic: "interview preparation",
    patterns: [
      "why did she choose it",
      "why information technology",
      "why is she interested in technology",
      "what motivates her to work in it",
      "why does she want a technology career",
    ],
    keywords: ["why it", "why technology", "motivation", "passion", "technology career"],
    answers: [
      "Mbali chose Information Technology because it combines logical problem-solving, creativity and practical impact. She enjoys understanding how software, databases and networks work together to solve real user and organisational needs.",
      "Technology appeals to her because it offers continuous learning and the chance to create systems that make processes more efficient, reliable and accessible.",
    ],
  },
  {
    id: "career-goals",
    topic: "interview preparation",
    patterns: [
      "what are her career goals",
      "where does she see herself in five years",
      "what does she want to achieve professionally",
      "what is her long term goal",
      "what is her short term goal",
    ],
    keywords: ["career goal", "five years", "future", "long term", "short term", "professional goal"],
    answers: [
      "Her immediate goal is to enter the IT industry through a graduate, internship or junior opportunity where she can strengthen her practical skills and learn from experienced professionals. Over time, she wants to become a dependable technology professional capable of designing secure, scalable and user-focused solutions.",
      "In the next few years, Mbali aims to build strong commercial experience, deepen her chosen technical speciality and take increasing responsibility for delivering reliable technology solutions.",
    ],
  },
  {
    id: "why-hire",
    topic: "interview preparation",
    priority: 8,
    patterns: [
      "why should we hire mbali",
      "why should a company hire her",
      "why is she a good candidate",
      "what makes her suitable",
      "why choose her",
      "what makes her stand out",
      "is she employable",
    ],
    keywords: ["why hire", "good candidate", "suitable", "stand out", "choose her", "employable"],
    answers: [
      "A company should consider Mbali because she combines a solid BSc IT foundation with practical work in full-stack development, databases, APIs, enterprise networking and cybersecurity. She is adaptable, persistent, collaborative and eager to learn. As an early-career candidate, she brings growth potential, fresh ideas and a responsible approach to technical work.",
      "Mbali offers both technical breadth and a strong learning mindset. She has demonstrated resilience by improving her matric result, self-funding her first university year and earning one of five HCL Technology bursaries. She would bring commitment, problem-solving, teamwork and a willingness to develop quickly under mentorship.",
      "Her value lies in her combination of software and infrastructure knowledge, practical project experience and core competencies such as communication, time management and continuous learning. She is ready to contribute at junior level while steadily expanding her professional experience.",
    ],
  },
  {
    id: "company-value",
    topic: "interview preparation",
    patterns: [
      "what can she bring to a company",
      "what value would she add",
      "how would she contribute",
      "what can she offer an employer",
      "what are the benefits of hiring her",
    ],
    keywords: ["bring to company", "value", "contribute", "offer employer", "benefit"],
    answers: [
      "Mbali can bring technical curiosity, disciplined problem-solving, a user-focused mindset and the ability to learn across different IT domains. She can contribute to coding, API, database, support, networking or security-related tasks while growing through feedback and mentorship.",
      "She would add value through reliable task ownership, willingness to learn, communication with teammates and a broad foundation that helps her understand both applications and the infrastructure supporting them.",
    ],
  },
  {
    id: "strengths",
    topic: "interview preparation",
    patterns: [
      "what are her greatest strengths",
      "what are her strengths",
      "what is she good at",
      "describe her best qualities",
      "strongest attributes",
    ],
    keywords: ["strength", "good at", "best quality", "attributes", "competencies"],
    answers: [
      "Mbali's strongest qualities are adaptability, problem-solving and continuous learning, supported by teamwork, communication and time management. Her academic journey also demonstrates persistence and the willingness to improve when faced with setbacks.",
      "Her key strengths are a broad technical foundation, resilience, structured problem-solving and openness to feedback. She is also comfortable learning across software, databases, networking and security.",
    ],
  },
  {
    id: "weakness",
    topic: "interview preparation",
    patterns: [
      "what is her weakness",
      "what are her weaknesses",
      "what area does she need to improve",
      "what is a suitable weakness answer",
      "development area",
    ],
    keywords: ["weakness", "improve", "development area", "limitation"],
    answers: [
      "A suitable honest answer is that Mbali is still building commercial industry experience because she is at the beginning of her career. She addresses this by completing practical projects, seeking feedback, studying consistently and actively pursuing graduate or junior opportunities.",
      "Her main development area is translating academic and project experience into large-scale professional experience. She is motivated to close that gap through mentorship, real team environments and continued hands-on learning.",
    ],
  },
  {
    id: "challenge-resilience",
    topic: "interview preparation",
    patterns: [
      "tell me about a challenge she overcame",
      "how has she shown resilience",
      "what difficult situation did she handle",
      "give an example of persistence",
      "how does she respond to setbacks",
    ],
    keywords: ["challenge", "resilience", "setback", "persistence", "overcame", "difficult"],
    answers: [
      "A clear example of resilience is her matric journey. After earning a Diploma pass in 2022, she chose to repeat matric in 2023, improved to a Bachelor's pass and gained university admission. She then self-funded her first year before earning an HCL Technology bursary.",
      "Mbali responds to setbacks by evaluating what needs to improve, taking practical action and continuing toward the goal. Her matric improvement and transition from self-funding to a competitive bursary demonstrate this mindset.",
    ],
  },
  {
    id: "learning-new-tech",
    topic: "interview preparation",
    patterns: [
      "how does she learn a new technology",
      "what would she do if she does not know a tool",
      "how quickly can she learn",
      "how does she approach unfamiliar technology",
    ],
    keywords: ["learn new technology", "unfamiliar", "new tool", "quick learner", "documentation"],
    answers: [
      "When learning unfamiliar technology, Mbali starts with the core concepts and official documentation, follows a small practical example, applies it to a project task, tests the result and records what she learned. She also asks focused questions when guidance is needed.",
      "Her learning process combines research, hands-on practice, debugging and feedback. This helps her move from understanding the theory to using the technology confidently.",
    ],
  },
  {
    id: "ideal-work-environment",
    topic: "interview preparation",
    patterns: [
      "what work environment suits her",
      "what is her ideal workplace",
      "how does she prefer to work",
      "what kind of team would she like",
    ],
    keywords: ["work environment", "ideal workplace", "team culture", "mentorship", "collaborative"],
    answers: [
      "Mbali would thrive in a collaborative and professional environment where expectations are clear, teammates share knowledge and junior employees receive constructive feedback and mentorship.",
      "Her ideal workplace combines meaningful technical work, continuous learning, supportive teamwork and opportunities to take increasing responsibility as her skills grow.",
    ],
  },
  {
    id: "pressure-deadlines",
    topic: "interview preparation",
    patterns: [
      "how does she work under pressure",
      "can she handle deadlines",
      "what does she do when work becomes stressful",
      "how would she manage multiple tasks",
    ],
    keywords: ["pressure", "stress", "deadline", "multiple tasks", "priorities"],
    answers: [
      "A suitable approach for Mbali is to remain calm, clarify priorities, break work into smaller actions and communicate early if a risk could affect the deadline. She focuses on completing the most important tasks accurately rather than rushing without a plan.",
      "She manages pressure by organising tasks according to urgency and impact, tracking progress and asking for clarification before a small problem becomes a larger delay.",
    ],
  },
  {
    id: "interview-introduction",
    topic: "interview preparation",
    patterns: [
      "how should she introduce herself in an interview",
      "give me an interview introduction",
      "tell me about yourself interview answer",
      "what should she say when asked about herself",
    ],
    keywords: ["interview introduction", "tell me about yourself", "introduce yourself", "opening answer"],
    answers: [
      "A strong introduction would be: 'I am Mbali Dyobiso, a BSc Information Technology student at North-West University, completing my degree in November 2026. My experience includes full-stack development, RESTful APIs, databases and enterprise networking. I have built a student transportation system and a secure office network, and I am looking for an opportunity where I can contribute, learn from experienced professionals and grow into a strong IT practitioner.'",
      "She can introduce herself by briefly covering her BSc IT studies, two main projects, strongest technical areas and interest in a graduate or junior opportunity that offers practical exposure and mentorship.",
    ],
  },
  {
    id: "graduate-programme-fit",
    topic: "career opportunities",
    patterns: [
      "is she suitable for a graduate programme",
      "why would she fit a graduate programme",
      "would she be a good graduate trainee",
      "graduate opportunity fit",
    ],
    keywords: ["graduate programme", "graduate trainee", "graduate role", "entry level programme"],
    answers: [
      "Mbali is well suited to a technology graduate programme because she has broad foundational knowledge, practical projects, evidence of resilience and a strong willingness to learn. A rotational programme could help her deepen software, database, networking or cybersecurity skills while contributing to real business work.",
      "Her mix of technical breadth and growth mindset makes her a strong graduate-programme candidate, particularly where structured training and mentorship are provided.",
    ],
  },
  {
    id: "internship-fit",
    topic: "career opportunities",
    patterns: [
      "is she suitable for an internship",
      "why should she get an internship",
      "what internship would suit her",
      "is she looking for internship experience",
    ],
    keywords: ["internship", "intern", "work experience", "student opportunity"],
    answers: [
      "An internship in software development, backend systems, databases, networking, IT support or cybersecurity would suit Mbali. She already has academic and project knowledge and now wants practical industry exposure, teamwork and mentorship.",
      "She would benefit from an internship that allows her to apply her skills to real tasks, receive feedback and understand professional development processes.",
    ],
  },
  {
    id: "experience-level",
    topic: "career opportunities",
    patterns: [
      "how much experience does she have",
      "does she have work experience",
      "what is her experience level",
      "is she entry level",
      "is she a junior candidate",
    ],
    keywords: ["experience", "work experience", "entry level", "junior", "early career"],
    answers: [
      "Mbali is an early-career, entry-level IT candidate. Her strongest current experience comes from university training and practical academic projects rather than long-term commercial employment.",
      "She is entering the industry with project-based experience in application development and enterprise networking and is seeking an opportunity to develop professional experience.",
    ],
  },
  {
    id: "availability",
    topic: "career opportunities",
    patterns: [
      "is she available for opportunities",
      "what roles is she looking for",
      "is she looking for work",
      "can she apply for graduate roles",
      "what opportunities does she want",
    ],
    keywords: ["available", "opportunity", "looking for work", "graduate role", "junior role", "internship"],
    answers: [
      "Mbali is interested in internships, graduate programmes and junior IT roles where she can contribute to software, backend, database, networking, infrastructure or cybersecurity work while continuing to learn.",
      "She is open to entry-level technology opportunities that offer practical responsibility, mentorship and room for professional growth.",
    ],
  },
  {
    id: "salary",
    topic: "career opportunities",
    patterns: [
      "what salary does she expect",
      "what are her salary expectations",
      "how much does she want to earn",
      "expected salary",
    ],
    keywords: ["salary", "compensation", "pay", "remuneration"],
    answers: [
      "A specific salary expectation is not stated in Mbali's portfolio. For an entry-level role, a suitable response is that she is open to a fair, market-related package aligned with the role, responsibilities, location and learning opportunity.",
    ],
  },
  {
    id: "contact",
    topic: "contact",
    priority: 8,
    patterns: [
      "how can i contact mbali",
      "what is her email address",
      "what is her phone number",
      "how do i reach her",
      "give me her contact details",
    ],
    keywords: ["contact", "email", "phone", "reach", "0638117206", "gmail"],
    answers: [
      "Mbali can be contacted at mbali.dyobisoentle@gmail.com or +27 63 811 7206.",
      "Her contact details are: email — mbali.dyobisoentle@gmail.com; phone — +27 63 811 7206.",
    ],
  },
  {
    id: "location",
    topic: "contact",
    patterns: [
      "where does she live",
      "where is she based",
      "what is her current location",
      "which city is she in",
    ],
    keywords: ["location", "based", "live", "klerksdorp", "north west"],
    answers: [
      "Mbali is based in Klerksdorp in the North West province of South Africa.",
      "Her current location is Klerksdorp, North West, South Africa.",
    ],
  },
  {
    id: "github",
    topic: "portfolio navigation",
    patterns: [
      "where is her github",
      "how can i view her source code",
      "where are her repositories",
      "show me her github projects",
    ],
    keywords: ["github", "source code", "repository", "repositories", "code"],
    answers: [
      "Use the Source Code buttons in the Projects section or the 'View All Projects on GitHub' button to open Mbali's repositories.",
      "Her project repositories are linked directly from the Projects section of this portfolio.",
    ],
  },
  {
    id: "download-cv",
    topic: "portfolio navigation",
    patterns: [
      "how do i download her cv",
      "where is her cv",
      "can i get her resume",
      "download cv",
      "download resume",
    ],
    keywords: ["cv", "download", "word document", "resume"],
    answers: [
      "Select the 'Download CV' button in the Home section to download Mbali's CV as a Word document.",
      "Her CV is available through the Download CV button near the top of the portfolio.",
    ],
  },
  {
    id: "reference",
    topic: "contact",
    patterns: [
      "does she have a reference",
      "who is her referee",
      "who can provide a reference",
      "reference contact",
    ],
    keywords: ["reference", "referee", "bongisa", "module facilitator"],
    answers: [
      "Her listed reference is Bongisa Dyosoba, a Module Facilitator at North-West University. The contact email shown in the portfolio is Bongisa.Dyosoba@nwu.ac.za.",
    ],
  },
  {
    id: "unknown-private-preference",
    topic: "clarification",
    patterns: [
      "what are her hobbies",
      "what is her favourite",
      "is she willing to relocate",
      "does she have a drivers licence",
      "what languages does she speak",
      "what is her relationship status",
    ],
    keywords: ["hobbies", "favourite", "relocate", "drivers licence", "languages spoken", "relationship status"],
    answers: [
      "That information is not included in Mbali's current portfolio knowledge base. You can use the Contact section to ask her directly.",
      "I do not have verified information about that personal detail. I can answer questions about her education, projects, skills, bursary, achievements and career interests instead.",
    ],
  },
]


type SemanticQuestionType =
  | "where"
  | "when"
  | "what"
  | "who"
  | "why"
  | "how"
  | "which"
  | "yes-no"
  | "general"

type SemanticSignals = {
  subject: "mbali"
  normalized: string
  tokens: string[]
  questionTypes: Set<SemanticQuestionType>
  actions: Set<string>
  concepts: Set<string>
}

const MBALI_PROFILE = {
  identity: {
    fullName: "Mbali Dyobiso",
    currentTitle: "BSc Information Technology student and aspiring software developer",
    currentLocation: "Klerksdorp, North West, South Africa",
  },
  birth: {
    date: "28 September 2004",
    city: "East London",
    province: "Eastern Cape",
    hospital: "St Dominic's Hospital",
  },
  family: {
    siblings: 2,
    household: "a two-parent household",
    parentsAlive: true,
  },
  places: {
    born: "East London, Eastern Cape",
    childhoodMove: "Welkom, Free State at the age of five",
    laterMove: "Klerksdorp, North West before starting Grade 5 in 2015",
    current: "Klerksdorp, North West",
  },
  education: {
    firstPrimary: {
      school: "St Helen Primary School",
      place: "Welkom, Free State",
      grades: "Grades 1–4",
      years: "2011–2014",
    },
    secondPrimary: {
      school: "Educators School",
      place: "Klerksdorp, North West",
      grades: "Grades 5–7",
      years: "2015–2017",
    },
    highSchool: {
      school: "Milner High School",
      place: "Klerksdorp, North West",
      years: "2018–2022",
      firstMatricResult: "Diploma pass in 2022",
      improvedMatricResult: "Bachelor's pass in 2023 after repeating matric",
    },
    university: {
      institution: "North-West University",
      campus: "Vanderbijlpark Campus",
      qualification: "Bachelor of Science (BSc) in Information Technology",
      startYear: 2024,
      expectedCompletion: "November 2026",
      status: "currently in progress",
    },
  },
  funding: {
    firstYear: "self-funded in 2024",
    bursaryProvider: "HCL Technology",
    bursaryAwardYear: 2025,
    selectedStudents: 5,
    currentSupport: "continued through 2026",
  },
  achievement: {
    certificate: "Introduction to Cybersecurity Certificate",
    provider: "Cisco Networking Academy",
    year: 2025,
  },
  competencies: [
    "Adaptability",
    "Time Management",
    "Team Collaboration",
    "Communication",
    "Problem-solving",
    "Continuous Learning",
  ],
  technologies: {
    programming: ["Java", "Python", "C++", "C#"],
    frontend: ["HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js"],
    backend: ["Node.js", "Express.js", "RESTful APIs"],
    databases: ["MySQL", "Oracle SQL", "MongoDB"],
    tools: ["GitHub", "Visual Studio Code", "Visual Studio", "Cisco Packet Tracer"],
    networking: [
      "VLANs",
      "inter-VLAN routing",
      "DHCP",
      "NAT",
      "ACLs",
      "ASA firewalls",
      "SSH remote management",
      "network segmentation",
    ],
  },
  projects: {
    unilift: {
      name: "UniLift Student Transportation Management System",
      year: 2025,
      area: "full-stack development",
      technologies: ["Node.js", "MySQL", "RESTful APIs", "JavaScript"],
      capabilities: [
        "student ride requests",
        "administrator management of drivers and vehicles",
        "CRUD dashboards",
        "role-based authentication",
        "real-time ride-status updates",
        "reporting",
      ],
    },
    network: {
      name: "Office Network Design and Implementation",
      year: 2026,
      area: "network engineering and security",
      technologies: [
        "Cisco Packet Tracer",
        "VLANs",
        "inter-VLAN routing",
        "DHCP",
        "NAT",
        "ACLs",
        "ASA firewalls",
        "SSH",
        "network segmentation",
      ],
      capabilities: [
        "a scalable multi-department office network",
        "collapsed-core architecture",
        "redundancy",
        "wired and wireless connectivity",
        "layered security controls",
      ],
    },
  },
  career: {
    preferredFields: [
      "software development",
      "backend development",
      "full-stack development",
      "database-focused development",
      "network engineering",
      "cybersecurity",
    ],
    entryLevelRoles: [
      "graduate software developer",
      "junior backend developer",
      "junior full-stack developer",
      "graduate database developer",
      "graduate network engineer",
      "cybersecurity or IT graduate trainee",
    ],
    goals:
      "to apply her academic foundation to real systems, grow through mentorship and practical experience, and contribute to reliable, scalable and user-focused technology solutions",
  },
} as const

const SEMANTIC_CONCEPT_ALIASES: Record<string, string[]> = {
  identity: ["who is she", "who is mbali", "tell me about her", "tell me about mbali", "profile", "background", "introduce her", "introduce mbali"],
  origin: ["where is she from", "where is mbali from", "come from", "comes from", "originally from", "origin", "place of origin", "home province", "native place", "hails from"],
  birthplace: ["born", "birthplace", "birthdate", "born hospital", "st dominic", "east london", "from originally", "place of birth"],
  age: ["age", "how old", "years old", "current age", "old is she", "old is mbali"],
  currentActivity: ["what does she do", "what does mbali do", "what is she doing", "current role", "current occupation", "occupation", "profession", "does she work", "is she a student", "work or study"],
  studyYear: ["year of study", "study year", "year in her course", "year in the course", "what year is she in", "which year is she in", "final year", "third year"],
  childhood: ["childhood", "grew up", "raised", "early life", "live", "lives", "living", "lived", "based", "current location", "hometown", "home town", "moved", "welkom", "klerksdorp"],
  family: ["family", "siblings", "brother", "sister", "parents", "household"],
  primarySchool: ["primary school", "primary education", "grade 1", "grade 4", "grade 5", "grade 7", "st helen", "educators school"],
  firstPrimary: ["st helen", "grade 1", "grade 2", "grade 3", "grade 4", "2011", "2012", "2013", "2014"],
  secondPrimary: ["educators school", "grade 5", "grade 6", "grade 7", "2015", "2016", "2017"],
  highSchool: ["high school", "milner", "secondary", "2018", "2019", "2020", "2021", "2022"],
  matric: ["matric", "diploma pass", "bachelor pass", "bachelors pass", "rewrite", "repeat matric", "redo matric", "2023"],
  university: ["university", "north-west university", "nwu", "vanderbijlpark", "campus", "tertiary"],
  degree: ["degree", "course", "qualification", "bsc", "information technology", "study", "studies"],
  graduation: ["graduate", "graduation", "complete degree", "finish degree", "expected completion", "november 2026"],
  admission: ["accepted", "admission", "enrolled", "start university", "began university"],
  bursary: ["bursary", "bursaries", "fund", "funds", "funded", "funding", "sponsor", "sponsors", "sponsored", "sponsorship", "hcl technology", "financial support", "study funding", "degree funding", "tuition support", "who funds her studies", "who pays for her studies"],
  selfFunding: ["self funded", "self-funded", "paid for first year", "first year funding", "2024 funding"],
  achievement: ["achievement", "certificate", "certification", "cisco", "networking academy"],
  competencies: ["core competencies", "strengths", "qualities", "attributes", "abilities"],
  technicalSkills: ["technical skills", "technology stack", "technologies", "tech", "tools", "programming"],
  programming: ["java", "python", "c++", "c#", "programming language", "coding language"],
  frontend: ["frontend", "html", "css", "javascript", "typescript", "react", "next.js"],
  backend: ["backend", "node.js", "express.js", "server side", "restful apis", "api"],
  databases: ["database", "mysql", "oracle sql", "mongodb", "sql"],
  networking: ["network", "networking", "vlan", "routing", "dhcp", "nat", "acl", "firewall", "ssh", "packet tracer"],
  cybersecurity: ["cybersecurity", "security", "secure", "firewall", "acl", "network segmentation"],
  projects: ["project", "projects", "portfolio work", "built", "developed", "implemented"],
  unilift: ["unilift", "transportation system", "ride system", "student transportation"],
  networkProject: ["office network", "network design", "packet tracer project", "enterprise network"],
  career: ["career", "careers", "it field", "it fields", "field in it", "field of it", "role", "roles", "it role", "it roles", "job", "jobs", "position", "positions", "profession", "work in it", "want to become", "future work", "suitable role", "suitable roles", "best role", "best roles", "career fit", "role fit"],
  hire: ["hire", "employ", "candidate", "choose her", "select her", "value to company", "bring to company", "stand out", "unique candidate", "best candidate"],
  interview: ["interview", "tell me about yourself", "why should we hire", "weakness", "work environment", "deadline", "pressure"],
  contact: ["contact", "email", "phone", "reach her", "get in touch"],
  reference: ["reference", "referee", "facilitator", "bongisa"],
  github: ["github", "repository", "repositories", "source code"],
  cv: ["cv", "download cv"],
}

const SEMANTIC_ACTION_ALIASES: Record<string, string[]> = {
  attend: ["attend", "attended", "school at"],
  complete: ["complete", "completed", "finish", "finished", "matriculated", "graduate"],
  study: ["study", "studying", "studies", "doing", "taking", "course"],
  start: ["start", "started", "begin", "began", "enrolled", "accepted"],
  move: ["move", "moved", "relocate", "relocated", "grew up", "lived"],
  receive: ["receive", "received", "get", "got", "awarded", "selected"],
  fund: ["fund", "funds", "funded", "funding", "is funding", "sponsor", "sponsors", "sponsored", "support", "supports", "supported", "pay", "pays", "paid", "pays for"],
  build: ["build", "built", "develop", "developed", "create", "created", "design", "designed", "implement", "implemented"],
  use: ["use", "used", "technology", "stack", "tool"],
  know: ["know", "knows", "experience", "experienced", "skill", "proficient", "familiar"],
  prefer: ["prefer", "preferred", "interested", "interest", "want", "would like", "passionate", "suit", "suits", "suited", "fit", "fits", "fitting", "match", "matches", "aligned", "best for", "appropriate for"],
  work: ["work", "working", "job", "occupation", "profession", "do for a living"],
  hire: ["hire", "employ", "recruit", "choose", "select"],
}

const QUESTION_WORD_PATTERNS: Array<[SemanticQuestionType, RegExp]> = [
  ["where", /\b(where|which place|what place|which school|what school|which high school|what high school|which primary school|what primary school|which university|what university|which institution|what institution|which campus|what campus)\b/],
  ["when", /\b(when|what year|which year|what date|which date|how long|from what year|until what year)\b/],
  ["what", /\b(what|tell me|describe|explain|give me|list|name)\b/],
  ["who", /\b(who|whose|which person|which company|what company|which provider)\b/],
  ["why", /\b(why|reason|motivation|motivated)\b/],
  ["how", /\b(how|in what way|by what means)\b/],
  ["which", /\b(which|what kind|what type)\b/],
  ["yes-no", /^(is|was|were|does|did|has|have|can|could|would|will)\b/],
]

const KNOWN_TECHNOLOGY_ALIASES: Record<string, string[]> = {
  Java: ["java"],
  Python: ["python"],
  "C++": ["c++", "cplusplus"],
  "C#": ["c#", "csharp"],
  HTML: ["html"],
  CSS: ["css"],
  JavaScript: ["javascript", "js"],
  TypeScript: ["typescript", "ts"],
  React: ["react", "react.js"],
  "Next.js": ["next.js", "nextjs"],
  "Node.js": ["node.js", "nodejs"],
  "Express.js": ["express.js", "expressjs", "express"],
  "RESTful APIs": ["restful apis", "api", "apis"],
  MySQL: ["mysql"],
  "Oracle SQL": ["oracle sql", "oracle"],
  MongoDB: ["mongodb", "mongo"],
  GitHub: ["github"],
  "Visual Studio Code": ["visual studio code", "vs code", "vscode"],
  "Visual Studio": ["visual studio"],
  "Cisco Packet Tracer": ["cisco packet tracer", "packet tracer"],
  VLANs: ["vlan", "vlans"],
  DHCP: ["dhcp"],
  NAT: ["nat"],
  ACLs: ["acl", "acls"],
  "ASA firewalls": ["asa firewall", "asa firewalls"],
  SSH: ["ssh"],
}

const COMMON_UNVERIFIED_TECHNOLOGIES = [
  "aws",
  "azure",
  "google cloud",
  "docker",
  "kubernetes",
  "php",
  "laravel",
  "angular",
  "vue",
  "svelte",
  "flutter",
  "dart",
  "kotlin",
  "swift",
  "ruby",
  "go",
  "rust",
  "spring boot",
  "django",
  "flask",
  "power bi",
  "tableau",
  "postgresql",
  "supabase",
  "firebase",
]

const containsNormalizedPhrase = (value: string, phrase: string) => {
  const normalizedPhrase = normalizeChatQuestion(phrase)

  if (!normalizedPhrase) {
    return false
  }

  return ` ${value} `.includes(` ${normalizedPhrase} `)
}

const hasAnyPhrase = (value: string, phrases: string[]) =>
  phrases.some((phrase) => containsNormalizedPhrase(value, phrase))

const detectSemanticSignals = (normalizedQuestion: string): SemanticSignals => {
  const questionTypes = new Set<SemanticQuestionType>()
  const actions = new Set<string>()
  const concepts = new Set<string>()

  QUESTION_WORD_PATTERNS.forEach(([questionType, pattern]) => {
    if (pattern.test(normalizedQuestion)) {
      questionTypes.add(questionType)
    }
  })

  if (questionTypes.size === 0) {
    questionTypes.add("general")
  }

  Object.entries(SEMANTIC_ACTION_ALIASES).forEach(([action, aliases]) => {
    if (hasAnyPhrase(normalizedQuestion, aliases)) {
      actions.add(action)
    }
  })

  Object.entries(SEMANTIC_CONCEPT_ALIASES).forEach(([concept, aliases]) => {
    if (hasAnyPhrase(normalizedQuestion, aliases)) {
      concepts.add(concept)
    }
  })

  return {
    subject: "mbali",
    normalized: normalizedQuestion,
    tokens: normalizedQuestion.split(" ").filter(Boolean),
    questionTypes,
    actions,
    concepts,
  }
}

const hasQuestionType = (signals: SemanticSignals, questionType: SemanticQuestionType) =>
  signals.questionTypes.has(questionType)

const hasConcept = (signals: SemanticSignals, concept: string) => signals.concepts.has(concept)
const hasAction = (signals: SemanticSignals, action: string) => signals.actions.has(action)

const chooseSemanticAnswer = (normalizedQuestion: string, key: string, answers: string[]) =>
  answers[stableAnswerIndex(`${normalizedQuestion}-${key}`, answers.length)]

const calculateMbaliAge = () => {
  const today = new Date()
  let age = today.getFullYear() - 2004
  const birthdayHasPassed = today.getMonth() > 8 || (today.getMonth() === 8 && today.getDate() >= 28)

  if (!birthdayHasPassed) {
    age -= 1
  }

  return age
}

const getMentionedKnownTechnologies = (normalizedQuestion: string) =>
  Object.entries(KNOWN_TECHNOLOGY_ALIASES)
    .filter(([, aliases]) => hasAnyPhrase(normalizedQuestion, aliases))
    .map(([technology]) => technology)

const getMentionedUnverifiedTechnologies = (normalizedQuestion: string) =>
  COMMON_UNVERIFIED_TECHNOLOGIES.filter((technology) =>
    normalizedQuestion.includes(technology),
  )

const joinNaturalList = (items: readonly string[]) => {
  if (items.length === 0) {
    return ""
  }

  if (items.length === 1) {
    return items[0]
  }

  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

const resolveDirectNaturalQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals

  const asksAge =
    /\bhow old\b/.test(normalized) ||
    /\bwhat(?:s| is) (?:mbalis|her) age\b/.test(normalized) ||
    /\bcurrent age\b/.test(normalized) ||
    /\bage (?:is|of) (?:mbali|she|her)\b/.test(normalized) ||
    /\b(?:mbali|she)\b.*\byears old\b/.test(normalized) ||
    hasConcept(signals, "age")

  if (asksAge) {
    return `Mbali was born on 28 September 2004, so she is currently ${calculateMbaliAge()} years old.`
  }

  const asksWhoFundsHerStudies =
    /\bwho (?:currently )?(?:funds|is funding|funded|sponsors|supports|pays for) (?:mbali(?:s)?|her) (?:studies|study|degree|course|education|university)\b/.test(normalized) ||
    /\bwho (?:gave|awarded) (?:mbali|her) (?:a )?(?:bursary|scholarship)\b/.test(normalized) ||
    /\bwhich (?:company|organisation|organization|institution)\b.*\b(?:funds|is funding|funded|sponsors|supports|awarded)\b/.test(normalized) ||
    /\bwhat (?:bursary|funding|financial support|sponsorship) (?:does|did|is) (?:mbali|she|her)\b/.test(normalized) ||
    (hasAction(signals, "fund") &&
      (hasConcept(signals, "degree") ||
        normalized.includes("studies") ||
        normalized.includes("study") ||
        normalized.includes("university") ||
        normalized.includes("education")))

  if (asksWhoFundsHerStudies) {
    return chooseSemanticAnswer(normalized, "current-study-funding-direct", [
      "HCL Technology funds Mbali's studies through a bursary awarded to her in 2025, and that support continues in 2026.",
      "Her university studies are currently supported by an HCL Technology bursary that she received in 2025.",
      "Mbali's current study funding comes from HCL Technology through a bursary awarded in 2025 and continued through 2026.",
      "The organisation funding her studies is HCL Technology, through the bursary she was awarded in 2025.",
      "She is funded by HCL Technology through a bursary that has supported her studies since 2025.",
      "HCL Technology is the current bursary provider supporting Mbali's degree studies in 2026.",
    ])
  }

  const asksSuitableItRoles =
    /\b(?:which|what)\b.*\b(?:it|technology|technical)\b.*\b(?:role|roles|job|jobs|position|positions|career|careers|field|fields)\b.*\b(?:suit|suits|fit|fits|match|matches|best|suitable|appropriate|aligned)\b/.test(normalized) ||
    /\b(?:which|what)\b.*\b(?:role|roles|job|jobs|position|positions|career|careers|field|fields)\b.*\b(?:suit|suits|fit|fits|match|matches|best|suitable|appropriate|aligned)\b.*\b(?:mbali|her|she)\b/.test(normalized) ||
    /\b(?:role|roles|job|jobs|position|positions|career|careers)\b.*\b(?:suit|suits|fit|fits|match|matches)\b.*\b(?:mbali|her|she)\b/.test(normalized) ||
    /\bwhat (?:it )?(?:job|role|position|career) (?:can|could|should|would) (?:mbali|she) (?:do|apply for|work in|work as)\b/.test(normalized) ||
    /\bwhat (?:can|could|should|would) (?:mbali|she) work as\b/.test(normalized)

  if (asksSuitableItRoles) {
    return chooseSemanticAnswer(normalized, "suitable-it-roles-direct", [
      "The IT roles that best suit Mbali's current profile are graduate software developer, junior backend developer, junior full-stack developer, graduate database developer, graduate network engineer and cybersecurity or IT graduate trainee roles.",
      "Based on her projects and technical stack, Mbali is well suited to entry-level software development, backend development, full-stack development, database development, network engineering and cybersecurity graduate roles.",
      "Her strongest role matches are junior or graduate positions in software engineering, backend systems, full-stack development, databases, networking and entry-level cybersecurity.",
      "Mbali would be a good fit for graduate software-development programmes, junior backend or full-stack roles, database-focused development, network-engineering positions and cybersecurity trainee opportunities.",
      "The clearest career fits for her are software and backend development, supported by her UniLift project, together with network engineering and cybersecurity, supported by her enterprise-network project.",
      "Suitable IT opportunities for Mbali include graduate developer, junior backend developer, junior full-stack developer, database developer, network engineer and IT or cybersecurity graduate trainee roles.",
    ])
  }

  const asksCurrentLocation =
    /\bwhere (?:does )?(?:mbali|she) (?:live|stay|reside)\b/.test(normalized) ||
    /\bwhere (?:is|s) (?:mbali|she) (?:currently )?(?:based|living|staying)\b/.test(normalized) ||
    /\bcurrent location\b/.test(normalized)

  if (asksCurrentLocation) {
    return "Mbali is currently based in Klerksdorp, North West, South Africa."
  }

  const asksOrigin =
    /\bwhere (?:is|s|was) (?:mbali|she) from\b/.test(normalized) ||
    /\bwhere does (?:mbali|she) come from\b/.test(normalized) ||
    /\bwhat (?:place|city|province) (?:is|was) (?:mbali|she) from\b/.test(normalized) ||
    /\b(?:mbali|she) (?:comes|came|hails) from where\b/.test(normalized) ||
    /\b(?:origin|place of origin|originally from|home province|native place|hails from)\b/.test(normalized) ||
    hasConcept(signals, "origin")

  if (asksOrigin) {
    return chooseSemanticAnswer(normalized, "origin-direct", [
      "Mbali is originally from East London in the Eastern Cape. She was born there at St Dominic's Hospital and is currently based in Klerksdorp, North West.",
      "She comes from East London, Eastern Cape, where she was born at St Dominic's Hospital. She later lived in Welkom and then moved to Klerksdorp.",
      "Mbali's place of origin is East London in the Eastern Cape. Her current base is Klerksdorp in the North West.",
    ])
  }

  const asksFutureProfession =
    hasAction(signals, "prefer") ||
    /\b(want|wants|interested|future|would like|hopes|aims)\b/.test(normalized)

  const asksCurrentActivity =
    !asksFutureProfession &&
    (/\bwhat does (?:mbali|she) do\b/.test(normalized) ||
      /\bwhat is (?:mbali|she) doing(?: now| currently)?\b/.test(normalized) ||
      /\bwhat(?:s| is) (?:mbalis|her) (?:current )?(?:role|occupation|profession)\b/.test(normalized) ||
      /\bdoes (?:mbali|she) work\b/.test(normalized) ||
      /\bis (?:mbali|she) (?:working|a student)\b/.test(normalized) ||
      /\bwhat does (?:mbali|she) do for a living\b/.test(normalized) ||
      hasConcept(signals, "currentActivity"))

  if (asksCurrentActivity) {
    if (/\bdoes (?:mbali|she) work\b/.test(normalized) || /\bcurrent job\b/.test(normalized)) {
      return "No current paid job is listed in Mbali's verified portfolio information. She is currently a BSc Information Technology student at North-West University and is building practical experience through software-development and network-engineering projects."
    }

    return chooseSemanticAnswer(normalized, "current-activity", [
      "Mbali is currently a BSc Information Technology student at North-West University. Alongside her studies, she develops software and database-backed projects, works on network-design projects and is preparing for a career in IT.",
      "Her current role is that of a BSc IT student and aspiring software developer. She is completing her degree while gaining practical experience in full-stack development, databases, networking and cybersecurity fundamentals.",
      "She is studying Information Technology at NWU and building her professional portfolio through projects such as UniLift and an enterprise office-network design.",
    ])
  }

  const asksStudyYear =
    /\bwhat year (?:of|in) (?:her|the) (?:course|degree|studies)\b/.test(normalized) ||
    /\bwhich year (?:of|in) (?:her|the) (?:course|degree|studies)\b/.test(normalized) ||
    /\bwhat year is (?:mbali|she) in\b/.test(normalized) ||
    /\bwhich year is (?:mbali|she) in\b/.test(normalized) ||
    /\b(?:year of study|study year|current academic year|final year)\b/.test(normalized) ||
    hasConcept(signals, "studyYear")

  if (asksStudyYear) {
    return "Mbali started her BSc Information Technology degree in 2024. In 2026, she is in her third and expected final year, with completion planned for November 2026."
  }

  return null
}

const resolveEducationQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals
  const asksWhere = hasQuestionType(signals, "where")
  const asksWhen = hasQuestionType(signals, "when")
  const asksWhy = hasQuestionType(signals, "why")
  const asksHow = hasQuestionType(signals, "how")

  if (hasConcept(signals, "highSchool")) {
    if (hasConcept(signals, "matric") || normalized.includes("pass") || normalized.includes("result")) {
      if (asksWhere) {
        return "Mbali completed her original high-school matric year at Milner High School in 2022, earning a Diploma pass. She repeated matric in 2023 and improved to a Bachelor's pass; the information provided does not name the school where she completed the 2023 rewrite."
      }

      if (asksWhy || asksHow) {
        return "After receiving a Diploma pass in 2022, Mbali repeated matric in 2023 to improve her university admission options. Her persistence paid off when she achieved a Bachelor's pass and was then accepted into a BSc Information Technology programme."
      }

      return chooseSemanticAnswer(normalized, "high-school-matric", [
        "Mbali attended Milner High School from 2018 to 2022. She completed matric there in 2022 with a Diploma pass, then repeated matric in 2023 and improved her result to a Bachelor's pass.",
        "Her high-school journey was at Milner High School between 2018 and 2022. She first earned a Diploma pass in 2022 and strengthened that result to a Bachelor's pass through a 2023 matric rewrite.",
      ])
    }

    if (asksWhere && asksWhen) {
      return "Mbali attended Milner High School in Klerksdorp from 2018 to 2022."
    }

    if (asksWhere || hasAction(signals, "attend") || hasAction(signals, "complete")) {
      return chooseSemanticAnswer(normalized, "high-school-where", [
        "Mbali completed her high-school education at Milner High School in Klerksdorp, North West.",
        "Her high school was Milner High School in Klerksdorp.",
        "She attended Milner High School in Klerksdorp, where she completed her initial matric year in 2022.",
      ])
    }

    if (asksWhen) {
      return "She attended Milner High School from 2018 to 2022."
    }

    return "Mbali's high-school education took place at Milner High School in Klerksdorp from 2018 to 2022. She matriculated in 2022 with a Diploma pass and improved to a Bachelor's pass after repeating matric in 2023."
  }

  if (hasConcept(signals, "matric")) {
    if (asksWhere) {
      return "Mbali completed her original matric year at Milner High School in 2022. Her supplied information does not identify the school used for the 2023 matric rewrite."
    }

    if (asksWhen) {
      return "She first completed matric in 2022 with a Diploma pass, then repeated the year in 2023 and achieved a Bachelor's pass."
    }

    if (asksWhy || asksHow) {
      return "She repeated matric to improve her result and qualify for broader university admission. She moved from a Diploma pass in 2022 to a Bachelor's pass in 2023."
    }

    return "Mbali earned a Diploma pass in 2022, repeated matric in 2023 and improved to a Bachelor's pass. That improvement supported her admission to university in 2024."
  }

  if (hasConcept(signals, "primarySchool")) {
    if (hasConcept(signals, "firstPrimary") && !hasConcept(signals, "secondPrimary")) {
      return "Mbali attended St Helen Primary School in Welkom, Free State, for Grades 1–4 from 2011 to 2014."
    }

    if (hasConcept(signals, "secondPrimary") && !hasConcept(signals, "firstPrimary")) {
      return "She attended Educators School in Klerksdorp for Grades 5–7 from 2015 to 2017."
    }

    if (asksWhere || hasAction(signals, "attend")) {
      return "Mbali attended St Helen Primary School in Welkom for Grades 1–4, then Educators School in Klerksdorp for Grades 5–7."
    }

    if (asksWhen) {
      return "Her primary-school years were 2011–2014 at St Helen Primary School and 2015–2017 at Educators School."
    }

    return "Mbali's primary education was split between St Helen Primary School in Welkom for Grades 1–4 (2011–2014) and Educators School in Klerksdorp for Grades 5–7 (2015–2017)."
  }

  const universityOrDegree =
    hasConcept(signals, "university") ||
    hasConcept(signals, "degree") ||
    hasConcept(signals, "graduation") ||
    hasConcept(signals, "admission") ||
    hasAction(signals, "study")

  if (universityOrDegree) {
    const mentionsCompletion = hasAction(signals, "complete") || hasConcept(signals, "graduation")

    if (
      normalized.includes("highest qualification") ||
      normalized.includes("qualification does she have") ||
      normalized.includes("completed qualification")
    ) {
      return "Mbali's completed school-leaving qualification is a National Senior Certificate with a Bachelor's pass, achieved in 2023. Her BSc in Information Technology is still in progress and is expected to be completed in November 2026."
    }

    if (asksWhere && mentionsCompletion) {
      return "Mbali has not completed the degree yet. She is currently completing a BSc in Information Technology at North-West University's Vanderbijlpark Campus and is expected to finish in November 2026."
    }

    if (asksWhere) {
      if (hasConcept(signals, "degree") || hasAction(signals, "study")) {
        return "Mbali studies toward a BSc in Information Technology at North-West University's Vanderbijlpark Campus."
      }

      return "She studies at North-West University on the Vanderbijlpark Campus."
    }

    if (asksWhen && (hasConcept(signals, "admission") || hasAction(signals, "start"))) {
      return "Mbali was accepted into the BSc Information Technology programme and began studying at NWU in 2024."
    }

    if (asksWhen || mentionsCompletion) {
      return "Her BSc Information Technology degree is still in progress, with expected completion in November 2026."
    }

    if (asksWhy) {
      return "Mbali chose Information Technology because it lets her combine logical problem-solving, software development, systems design, databases and networking to build useful digital solutions."
    }

    if (asksHow && hasConcept(signals, "admission")) {
      return "After improving her matric result to a Bachelor's pass in 2023, Mbali was accepted into North-West University's BSc Information Technology programme in 2024."
    }

    if (hasConcept(signals, "degree") || hasAction(signals, "study")) {
      return chooseSemanticAnswer(normalized, "degree", [
        "Mbali is studying toward a Bachelor of Science (BSc) in Information Technology at North-West University's Vanderbijlpark Campus.",
        "Her current course is a BSc in Information Technology at NWU's Vanderbijlpark Campus.",
        "She is completing a Bachelor of Science in Information Technology, which is expected to finish in November 2026.",
      ])
    }

    return "Mbali started at North-West University's Vanderbijlpark Campus in 2024, where she is completing a BSc in Information Technology with expected completion in November 2026."
  }

  if (
    normalized.includes("education") ||
    normalized.includes("academic journey") ||
    normalized.includes("school history") ||
    normalized.includes("schooling")
  ) {
    return "Mbali attended St Helen Primary School in Welkom for Grades 1–4 (2011–2014), Educators School in Klerksdorp for Grades 5–7 (2015–2017), and Milner High School from 2018–2022. She improved her matric result to a Bachelor's pass in 2023, then began a BSc in Information Technology at NWU's Vanderbijlpark Campus in 2024. She expects to complete the degree in November 2026."
  }

  return null
}

const resolvePersonalHistoryQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals
  const asksWhere = hasQuestionType(signals, "where")
  const asksWhen = hasQuestionType(signals, "when")

  if (hasConcept(signals, "age")) {
    return `Mbali was born on 28 September 2004, so she is currently ${calculateMbaliAge()} years old.`
  }

  if (hasConcept(signals, "birthplace")) {
    if (asksWhere && asksWhen) {
      return "Mbali was born on 28 September 2004 at St Dominic's Hospital in East London, Eastern Cape."
    }

    if (asksWhen) {
      return "Mbali was born on 28 September 2004."
    }

    if (normalized.includes("hospital")) {
      return "She was born at St Dominic's Hospital in East London, Eastern Cape."
    }

    if (asksWhere || normalized.includes("from originally")) {
      return "Mbali was born in East London in the Eastern Cape, at St Dominic's Hospital."
    }

    return "Mbali was born on 28 September 2004 at St Dominic's Hospital in East London, Eastern Cape."
  }

  if (hasConcept(signals, "childhood")) {
    if (
      normalized.includes("current") ||
      normalized.includes("currently") ||
      normalized.includes("now") ||
      normalized.includes("live") ||
      normalized.includes("lives") ||
      normalized.includes("based") ||
      normalized.includes("hometown") ||
      normalized.includes("home town")
    ) {
      return "Mbali is currently based in Klerksdorp, North West, South Africa."
    }

    if (normalized.includes("welkom") && asksWhen) {
      return "She moved from East London to Welkom when she was five years old."
    }

    if (normalized.includes("klerksdorp") && asksWhen) {
      return "She moved to Klerksdorp before starting Grade 5 at Educators School in 2015."
    }

    if (asksWhere || hasAction(signals, "move")) {
      return "Mbali was born in East London, moved to Welkom in the Free State at age five, and later moved to Klerksdorp in the North West, where she continued school and is currently based."
    }

    return "Her early life crossed three provinces: Eastern Cape, where she was born; Free State, where she lived from age five; and North West, where she continued her education in Klerksdorp."
  }

  if (hasConcept(signals, "family")) {
    if (normalized.includes("sibling") || normalized.includes("brother") || normalized.includes("sister")) {
      return "Mbali has two siblings."
    }

    if (normalized.includes("parent")) {
      return "She grew up in a two-parent household, and both of her parents are alive."
    }

    return "Mbali grew up in a two-parent household, has two siblings, and both of her parents are alive."
  }

  if (hasConcept(signals, "identity")) {
    return chooseSemanticAnswer(normalized, "identity-structured", [
      "Mbali Dyobiso is a South African BSc Information Technology student at North-West University. She combines software-development, database, networking and cybersecurity foundations with practical academic projects, and she is expected to complete her degree in November 2026.",
      "Mbali is an aspiring IT professional currently completing a BSc in Information Technology at NWU. Her experience includes full-stack development, database-backed systems, network design and cybersecurity fundamentals.",
    ])
  }

  return null
}

const resolveFundingAndAchievementQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals
  const asksWho = hasQuestionType(signals, "who")
  const asksWhen = hasQuestionType(signals, "when")
  const asksHow = hasQuestionType(signals, "how")
  const asksWhy = hasQuestionType(signals, "why")

  if (hasConcept(signals, "bursary") || hasConcept(signals, "selfFunding") || hasAction(signals, "fund")) {
    if (hasConcept(signals, "selfFunding") && !normalized.includes("hcl")) {
      return "Mbali self-funded her first year of university in 2024."
    }

    if (asksWho && asksWhen) {
      return "HCL Technology awarded Mbali a bursary in 2025, and that support continued through 2026."
    }

    if (asksWho) {
      return chooseSemanticAnswer(normalized, "bursary-provider", [
        "HCL Technology currently funds Mbali's studies through a bursary awarded in 2025.",
        "Her current bursary provider is HCL Technology, which began supporting her studies in 2025.",
        "Mbali's studies are funded by HCL Technology through the bursary she received in 2025.",
        "The organisation supporting her degree is HCL Technology through its bursary funding.",
        "HCL Technology is the company currently providing bursary support for Mbali's studies.",
        "She receives her current study funding from an HCL Technology bursary.",
      ])
    }

    if (asksWhen) {
      return "She received the HCL Technology bursary in 2025, and the funding continued through 2026. Her first year in 2024 was self-funded."
    }

    if (normalized.includes("how many") || normalized.includes("five")) {
      return "Mbali was one of only five students selected for the HCL Technology bursary in 2025."
    }

    if (asksHow || asksWhy || normalized.includes("significance") || normalized.includes("important")) {
      return "The HCL Technology bursary is significant because Mbali moved from self-funding her first year in 2024 to being selected as one of five bursary recipients in 2025. It reflects academic promise and has continued supporting her through 2026."
    }

    return "Mbali self-funded her first university year in 2024. In 2025, she became one of five students awarded an HCL Technology bursary, and that bursary continued funding her studies in 2026."
  }

  if (hasConcept(signals, "achievement")) {
    if (asksWho) {
      return "The certificate was awarded through Cisco Networking Academy."
    }

    if (asksWhen) {
      return "Mbali completed the Introduction to Cybersecurity Certificate in 2025."
    }

    return "Mbali's listed achievement is an Introduction to Cybersecurity Certificate from Cisco Networking Academy, completed in 2025."
  }

  return null
}

const resolveTechnologyQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals
  const knownTechnologies = getMentionedKnownTechnologies(normalized)
  const unverifiedTechnologies = getMentionedUnverifiedTechnologies(normalized)
  const technologyCheck =
    hasAction(signals, "know") ||
    hasAction(signals, "use") ||
    /\bdoes she (know|use|have experience with)\b/.test(normalized)

  if (technologyCheck && knownTechnologies.length > 0) {
    const asksWhereUsed = hasQuestionType(signals, "where") || normalized.includes("which project")

    if (asksWhereUsed) {
      const uniLiftTechnologies = ["Node.js", "JavaScript", "RESTful APIs", "MySQL"]
      const networkTechnologies = ["Cisco Packet Tracer", "VLANs", "DHCP", "NAT", "ACLs", "ASA firewalls", "SSH"]
      const usedInUniLift = knownTechnologies.filter((technology) => uniLiftTechnologies.includes(technology))
      const usedInNetworkProject = knownTechnologies.filter((technology) => networkTechnologies.includes(technology))

      if (usedInUniLift.length > 0) {
        return `${joinNaturalList(usedInUniLift)} ${usedInUniLift.length === 1 ? "was" : "were"} used in the UniLift Student Transportation Management System.`
      }

      if (usedInNetworkProject.length > 0) {
        return `${joinNaturalList(usedInNetworkProject)} ${usedInNetworkProject.length === 1 ? "was" : "were"} used in the Office Network Design and Implementation project.`
      }

      return `${joinNaturalList(knownTechnologies)} ${knownTechnologies.length === 1 ? "is" : "are"} listed in Mbali's technical skills, but the current portfolio does not connect ${knownTechnologies.length === 1 ? "it" : "them"} to a specific named project.`
    }

    return `Yes. Mbali's verified portfolio lists experience with ${joinNaturalList(knownTechnologies)}. Her level of exposure varies by technology, with the strongest evidence coming from her academic projects and technical-skills section.`
  }

  if (technologyCheck && unverifiedTechnologies.length > 0) {
    return `The current portfolio does not verify experience with ${joinNaturalList(unverifiedTechnologies)}. It would be more accurate to ask Mbali directly rather than assume that skill.`
  }

  if (hasConcept(signals, "programming")) {
    return "Her listed programming languages are Java, Python, C++ and C#. She also uses JavaScript and TypeScript for web development."
  }

  if (hasConcept(signals, "frontend")) {
    return "Mbali's frontend stack includes HTML, CSS, JavaScript, TypeScript, React and Next.js."
  }

  if (hasConcept(signals, "backend")) {
    return "Her backend and API skills include Node.js, Express.js and RESTful APIs. She demonstrated these most clearly in the UniLift full-stack project."
  }

  if (hasConcept(signals, "databases")) {
    return "Mbali's database knowledge includes MySQL, Oracle SQL and MongoDB. Her strongest demonstrated project use is MySQL in the UniLift transportation system."
  }

  if (hasConcept(signals, "cybersecurity")) {
    return "Her cybersecurity foundation includes Cisco's Introduction to Cybersecurity certificate and practical network-security work involving ACLs, ASA firewalls, SSH management and network segmentation."
  }

  if (hasConcept(signals, "networking")) {
    return "Her networking knowledge includes VLANs, inter-VLAN routing, DHCP, NAT, ACLs, ASA firewalls, SSH remote management, redundancy and network segmentation, primarily demonstrated in Cisco Packet Tracer."
  }

  if (hasConcept(signals, "technicalSkills")) {
    return "Mbali's technology stack covers Java, Python, C++, C#, HTML, CSS, JavaScript, TypeScript, React, Next.js, Node.js, Express.js, RESTful APIs, MySQL, Oracle SQL, MongoDB, GitHub, Visual Studio Code, Visual Studio and Cisco Packet Tracer. She also has practical networking exposure to VLANs, routing, DHCP, NAT, ACLs, ASA firewalls, SSH and segmentation."
  }

  return null
}

const resolveProjectQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals
  const asksWhen = hasQuestionType(signals, "when")
  const asksHow = hasQuestionType(signals, "how")
  const asksWhy = hasQuestionType(signals, "why")
  const asksTechnology =
    hasAction(signals, "use") ||
    hasConcept(signals, "technicalSkills") ||
    normalized.includes("technology") ||
    normalized.includes("stack")

  const refersToUniLiftByTechnology =
    hasConcept(signals, "projects") &&
    hasAnyPhrase(normalized, ["mysql", "node.js", "restful apis", "ride", "transportation"])
  const refersToNetworkProjectByTechnology =
    hasConcept(signals, "projects") &&
    hasAnyPhrase(normalized, ["packet tracer", "vlan", "vlans", "dhcp", "nat", "acl", "acls", "asa firewall", "asa firewalls", "ssh"])

  if (
    hasConcept(signals, "unilift") ||
    refersToUniLiftByTechnology ||
    (hasConcept(signals, "projects") && normalized.includes("2025"))
  ) {
    if (asksWhen) {
      return "The UniLift Student Transportation Management System was completed in 2025."
    }

    if (asksTechnology) {
      return "UniLift was built with Node.js, MySQL, RESTful APIs and JavaScript."
    }

    if (asksHow || normalized.includes("feature") || normalized.includes("work")) {
      return "UniLift allows students to request rides while administrators manage drivers, vehicles and transport requests. It includes responsive CRUD dashboards, role-based authentication, real-time ride-status updates and reporting."
    }

    if (asksWhy) {
      return "The project addresses university transport coordination by giving students a clear ride-request process and administrators a structured way to allocate and monitor transport resources."
    }

    return "UniLift is Mbali's 2025 full-stack student transportation management system. It combines Node.js, MySQL, RESTful APIs and JavaScript to support ride requests, administrative management, authentication, live statuses and reporting."
  }

  if (
    hasConcept(signals, "networkProject") ||
    refersToNetworkProjectByTechnology ||
    (hasConcept(signals, "projects") && normalized.includes("2026"))
  ) {
    if (asksWhen) {
      return "The Office Network Design and Implementation project was completed in 2026."
    }

    if (asksTechnology) {
      return "The network project used Cisco Packet Tracer, VLANs, inter-VLAN routing, DHCP, NAT, ACLs, ASA firewalls, SSH and network segmentation."
    }

    if (asksHow || normalized.includes("feature") || normalized.includes("security")) {
      return "Mbali designed a scalable multi-department office network with a collapsed-core architecture, redundancy, wired and wireless connectivity, VLAN segmentation, routing, DHCP, NAT, ACLs, ASA firewalls and secure SSH management."
    }

    if (asksWhy) {
      return "The project was designed to provide reliable, scalable and secure connectivity across a multi-department office while controlling access and reducing unnecessary network exposure."
    }

    return "Her 2026 Office Network Design and Implementation project is a secure enterprise network built in Cisco Packet Tracer with segmentation, routing, redundancy and layered security controls."
  }

  if (hasConcept(signals, "projects")) {
    if (asksTechnology) {
      return "Across her two main projects, Mbali used Node.js, MySQL, RESTful APIs and JavaScript for UniLift, and Cisco Packet Tracer, VLANs, routing, DHCP, NAT, ACLs, ASA firewalls, SSH and segmentation for the office-network project."
    }

    return "Mbali's portfolio currently highlights two completed academic projects: the 2025 UniLift Student Transportation Management System and the 2026 Office Network Design and Implementation project. Together they demonstrate full-stack development, databases, APIs, network design and security."
  }

  return null
}

const resolveCareerAndInterviewQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals

  if (hasConcept(signals, "hire") || hasAction(signals, "hire")) {
    return chooseSemanticAnswer(normalized, "hire-semantic", [
      "A company should consider Mbali because she combines a broad BSc IT foundation with practical full-stack and network-engineering projects. She brings adaptability, communication, teamwork, time management, problem-solving and a strong willingness to learn. As an early-career candidate, she offers potential, discipline and evidence that she can improve through effort.",
      "Mbali would bring a useful mix of software, database, networking and cybersecurity foundations. Her projects show that she can turn academic concepts into working solutions, while her matric-improvement journey and HCL bursary demonstrate resilience and recognised potential.",
    ])
  }

  if (hasConcept(signals, "competencies")) {
    if (normalized.includes("weakness")) {
      return "A balanced interview answer would be that Mbali is still building professional industry experience because most of her current experience is academic. She addresses this by practising continuously, completing projects, seeking feedback and actively pursuing graduate or internship opportunities."
    }

    return `Her core competencies are ${joinNaturalList(MBALI_PROFILE.competencies)}.`
  }

  if (hasConcept(signals, "career") || hasAction(signals, "prefer")) {
    if (
      normalized.includes("role") ||
      normalized.includes("roles") ||
      normalized.includes("job") ||
      normalized.includes("jobs") ||
      normalized.includes("position") ||
      normalized.includes("positions") ||
      normalized.includes("suit") ||
      normalized.includes("fit") ||
      normalized.includes("match")
    ) {
      return chooseSemanticAnswer(normalized, "career-role-fit", [
        `Roles that align with her current profile include ${joinNaturalList(MBALI_PROFILE.career.entryLevelRoles)}.`,
        `Based on her studies and project experience, suitable roles include ${joinNaturalList(MBALI_PROFILE.career.entryLevelRoles)}.`,
        `Her current skills make her a strong entry-level fit for ${joinNaturalList(MBALI_PROFILE.career.entryLevelRoles)}.`,
        `The most suitable IT opportunities for Mbali are ${joinNaturalList(MBALI_PROFILE.career.entryLevelRoles)}.`,
        `Mbali's software, database and networking background aligns well with ${joinNaturalList(MBALI_PROFILE.career.entryLevelRoles)}.`,
      ])
    }

    if (hasAction(signals, "prefer") || normalized.includes("field") || normalized.includes("interest")) {
      return `Based on her studies and projects, Mbali is best aligned with ${joinNaturalList(MBALI_PROFILE.career.preferredFields)}. Software and backend development appear especially strong fits, while networking and cybersecurity are also credible paths.`
    }

    if (normalized.includes("goal") || normalized.includes("future") || normalized.includes("five years")) {
      return `Her career goal is ${MBALI_PROFILE.career.goals}. Over time, she would like to deepen her expertise and grow from a graduate or junior role into a dependable IT professional.`
    }

    return `Mbali's strongest career directions are ${joinNaturalList(MBALI_PROFILE.career.preferredFields)}.`
  }

  if (hasConcept(signals, "interview")) {
    if (normalized.includes("tell me about yourself") || normalized.includes("introduce")) {
      return "Mbali could introduce herself as a BSc Information Technology student at North-West University who is expected to graduate in November 2026. She has practical experience through a full-stack transport-management system and a secure enterprise-network project, with skills spanning software development, databases, APIs, networking and cybersecurity fundamentals. She is adaptable, eager to learn and looking for an opportunity to contribute while growing professionally."
    }

    if (normalized.includes("pressure") || normalized.includes("deadline")) {
      return "Mbali can explain that she handles pressure by breaking work into smaller tasks, prioritising deadlines, tracking progress and communicating early when support or clarification is needed. Her time-management and adaptability strengths support this approach."
    }

    if (normalized.includes("team") || normalized.includes("conflict")) {
      return "A strong interview response would emphasise that Mbali listens to teammates, communicates respectfully, focuses on the shared goal and uses clear task ownership to keep collaboration productive."
    }

    if (normalized.includes("learn") || normalized.includes("new technology")) {
      return "Mbali approaches unfamiliar technology by understanding the requirement, reviewing reliable documentation, testing small examples, applying the concept in practice and asking focused questions when needed."
    }

    return "The assistant can help with interview questions about Mbali's introduction, strengths, development area, projects, teamwork, pressure, learning style, preferred IT roles, career goals and reasons a company should hire her."
  }

  return null
}

const resolveNavigationAndContactQuestion = (signals: SemanticSignals) => {
  const { normalized } = signals

  if (hasConcept(signals, "reference")) {
    return "Mbali's listed reference is Bongisa Dyosoba, a Module Facilitator at North-West University. The portfolio lists the email Bongisa.Dyosoba@nwu.ac.za."
  }

  if (hasConcept(signals, "contact")) {
    if (normalized.includes("phone") || normalized.includes("number") || normalized.includes("call")) {
      return "Mbali's listed phone number is +27 63 811 7206."
    }

    if (normalized.includes("email")) {
      return "Her listed email address is mbali.dyobisoentle@gmail.com."
    }

    return "You can contact Mbali through the portfolio's Contact section, by email at mbali.dyobisoentle@gmail.com or by phone at +27 63 811 7206."
  }

  if (hasConcept(signals, "github")) {
    return "Use the Source Code buttons in the Projects section or the View All Projects on GitHub button to open Mbali's repositories."
  }

  if (hasConcept(signals, "cv")) {
    return "Use the Download CV button in the Home section to download Mbali's CV as a Word document."
  }

  return null
}

const resolveStructuredChatResponse = (normalizedQuestion: string) => {
  const signals = detectSemanticSignals(normalizedQuestion)

  const resolvers = [
    resolveDirectNaturalQuestion,
    resolvePersonalHistoryQuestion,
    resolveFundingAndAchievementQuestion,
    resolveProjectQuestion,
    resolveTechnologyQuestion,
    resolveEducationQuestion,
    resolveCareerAndInterviewQuestion,
    resolveNavigationAndContactQuestion,
  ]

  for (const resolver of resolvers) {
    const response = resolver(signals)

    if (response) {
      return response
    }
  }

  return null
}

const isContextDependentQuestion = (normalizedQuestion: string) => {
  const tokens = normalizedQuestion.split(" ").filter(Boolean)
  const signals = detectSemanticSignals(normalizedQuestion)

  // A question that already names a clear topic must stand on its own.
  // This prevents a previous course question from changing an age, origin,
  // occupation, school or other explicit question into the wrong intent.
  if (signals.concepts.size > 0) {
    return false
  }

  const clearlyElliptical =
    /\b(that|it|there|then|the same|which one|what about that|and what about that)\b/.test(
      normalizedQuestion,
    )

  const shortBareFollowUp =
    tokens.length <= 4 &&
    /^(and )?(where|when|why|how|which one|what year|what place|what result|what about it)$/.test(
      normalizedQuestion,
    )

  return clearlyElliptical || shortBareFollowUp
}

const scoreKnowledgeIntent = (
  normalizedQuestion: string,
  questionTokens: string[],
  intent: KnowledgeIntent,
) => {
  let score = 0
  let exactPatternMatches = 0
  let hasMatch = false

  intent.patterns.forEach((pattern) => {
    const normalizedPattern = normalizeChatQuestion(pattern)

    if (normalizedQuestion === normalizedPattern) {
      score += 30
      exactPatternMatches += 1
      hasMatch = true
      return
    }

    if (containsNormalizedPhrase(normalizedQuestion, normalizedPattern)) {
      score += 15 + normalizedPattern.split(" ").length
      exactPatternMatches += 1
      hasMatch = true
    }
  })

  intent.keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeChatQuestion(keyword)

    if (containsNormalizedPhrase(normalizedQuestion, normalizedKeyword)) {
      score += normalizedKeyword.includes(" ") ? 8 : 5
      hasMatch = true
      return
    }

    const keywordTokens = normalizedKeyword.split(" ")
    const allKeywordTokensMatch = keywordTokens.every((keywordToken) =>
      questionTokens.some((questionToken) => fuzzyTokenMatch(questionToken, keywordToken)),
    )

    if (allKeywordTokensMatch) {
      score += keywordTokens.length > 1 ? 4 : 2
      hasMatch = true
    }
  })

  if (hasMatch) {
    score += intent.priority ?? 0
  }

  return {
    intent,
    score,
    exactPatternMatches,
  }
}

const fallbackResponses = [
  "I could not confidently match that question to a verified detail in Mbali's portfolio. Try rephrasing it around a clear topic, such as her high school, university course, bursary, projects, skills or career goals. I will not guess when the information is not confirmed.",
  "That question did not connect strongly enough to the verified knowledge I have about Mbali. You could ask something like, ‘Which school did she attend?’, ‘What does she study?’, ‘Who funds her degree?’ or ‘What technologies has she used?’",
  "I do not have a reliable answer for that wording yet. Please mention the person, action and topic more clearly—for example, ‘Where did Mbali matriculate?’, ‘When did she begin university?’ or ‘Which project used MySQL?’",
  "I want to keep the answer accurate, so I cannot fill in missing information. Try asking about Mbali's education, projects, technical stack, HCL bursary, achievements, strengths or preferred IT field using a little more detail.",
  "I was not able to identify the exact subject of that question from the portfolio knowledge base. A clearer version could be, ‘Where did Mbali attend high school?’, ‘What course is she completing?’ or ‘Why would she be a strong graduate candidate?’",
  "There is not enough verified information for me to answer that exactly as written. Rephrase the question with a specific subject such as school, degree, funding, project, programming language, networking skill or career interest.",
  "I could not find a confirmed portfolio fact that answers that request. You may get a better result by asking one direct question, such as ‘Who awarded Mbali a bursary?’, ‘What did she build for UniLift?’ or ‘Which IT roles suit her?’",
  "That wording is outside the information I can answer with confidence. Please try another phrasing that names the topic—for example, Mbali's childhood, education timeline, matric results, university, bursary, projects, skills or interview strengths.",
  "I understood that you are asking about Mbali, but I could not determine which verified detail you need. Try using a question word and a topic, such as ‘Where did she study?’, ‘When did she matriculate?’, ‘What did she develop?’ or ‘Who supports her studies?’",
  "I cannot confirm an accurate answer from the available portfolio information. Ask again with a clearer action and object—for example, ‘Which high school did Mbali complete?’, ‘What degree is she pursuing?’ or ‘What technologies were used in her network project?’",
  "The knowledge base does not contain a dependable answer for that exact request. I can still help with questions about Mbali's biography, education, funding, achievements, software projects, networking project, technical skills and career direction.",
  "I would rather ask you to rephrase than provide an invented answer. Try a specific form such as ‘Where was Mbali born?’, ‘When did she move to Klerksdorp?’, ‘What qualification is she studying?’ or ‘What are her strongest competencies?’",
  "I could not resolve that sentence to one verified topic. Please simplify it or mention the key noun, such as high school, university, course, bursary, UniLift, networking, database, programming, cybersecurity or employment.",
  "That question may be using wording I have not matched yet. Try expressing the same idea differently—for example, replace ‘course’ with ‘degree’, ‘school’ with ‘high school’, ‘funding’ with ‘bursary’, or ‘work’ with ‘project’.",
  "I do not have a confirmed response for that exact question. I can answer accurately when the request points to a known fact, such as where Mbali studied, what she built, which technologies she knows, who funds her or what roles interest her.",
  "I could not identify a safe, factual answer from Mbali's portfolio data. Please ask a more focused question, and I will use only the information that has been verified rather than making assumptions.",
]

const getFallbackResponse = (variantSeed: number) => {
  const safeSeed = Math.abs(variantSeed)
  return fallbackResponses[safeSeed % fallbackResponses.length]
}

const lowerFirstCharacter = (value: string) =>
  value.length > 0 ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : value

const makePronounOpening = (answer: string) =>
  answer
    .replace(/^Mbali's\b/, "Her")
    .replace(/^Mbali\b/, "She")

/**
 * Produces several natural sentence variations without changing the
 * underlying fact returned by the chatbot's matching logic.
 *
 * The first branch handles age answers with genuine paraphrases. The generic
 * branch gives every other verified answer multiple presentation styles, so
 * repeatedly asking for the same fact does not return the exact same sentence.
 */
const buildAnswerVariations = (answer: string) => {
  const trimmedAnswer = answer.trim()
  const ageMatch = trimmedAnswer.match(
    /^Mbali was born on (.+?), so she is currently (\d+) years old\.$/,
  )

  if (ageMatch) {
    const [, birthDate, age] = ageMatch

    return [
      trimmedAnswer,
      `She is currently ${age} years old. Mbali was born on ${birthDate}.`,
      `At present, Mbali is ${age}. Her date of birth is ${birthDate}.`,
      `Based on her birth date of ${birthDate}, Mbali's current age is ${age}.`,
      `Mbali is now ${age} years old, having been born on ${birthDate}.`,
      `Her current age is ${age}; she was born on ${birthDate}.`,
      `Born on ${birthDate}, Mbali is ${age} years old today.`,
      `The portfolio records Mbali's birth date as ${birthDate}, which makes her ${age} years old currently.`,
    ]
  }

  const currentLocationMatch = trimmedAnswer.match(
    /^Mbali is currently based in (.+)\.$/,
  )

  if (currentLocationMatch) {
    const [, location] = currentLocationMatch

    return [
      trimmedAnswer,
      `Her current base is ${location}.`,
      `Mbali currently lives in ${location}.`,
      `At present, she is based in ${location}.`,
      `The portfolio lists ${location} as Mbali's current location.`,
      `She is presently located in ${location}.`,
      `Mbali's current place of residence is ${location}.`,
      `According to the information provided, she is now based in ${location}.`,
    ]
  }

  const pronounOpening = makePronounOpening(trimmedAnswer)
  const lowerPronounOpening = lowerFirstCharacter(pronounOpening)
  const lowerOriginal = lowerFirstCharacter(trimmedAnswer)

  const candidates = [
    trimmedAnswer,
    `According to Mbali's verified portfolio information, ${lowerPronounOpening}`,
    `The portfolio confirms that ${lowerPronounOpening}`,
    `From the details provided, ${lowerPronounOpening}`,
    `Based on the verified information available, ${lowerPronounOpening}`,
    `A concise answer is that ${lowerPronounOpening}`,
    `The information supplied about Mbali shows that ${lowerPronounOpening}`,
    `In other words, ${lowerPronounOpening}`,
    `The confirmed detail is that ${lowerOriginal}`,
    `Mbali's portfolio indicates that ${lowerPronounOpening}`,
    `To put it another way, ${lowerPronounOpening}`,
    `The available portfolio facts show that ${lowerPronounOpening}`,
  ]

  return [...new Set(candidates)]
}

const applyAnswerVariation = (answer: string, variationIndex: number) => {
  const variations = buildAnswerVariations(answer)
  const safeIndex = Math.abs(variationIndex) % variations.length
  return variations[safeIndex]
}

const isFallbackChatResponse = (answer: string) =>
  fallbackResponses.includes(answer)

const getChatbotResponse = (
  question: string,
  previousUserQuestion?: string,
  fallbackVariant = 0,
) => {
  const normalizedQuestion = normalizeChatQuestion(question)

  if (!normalizedQuestion) {
    return "Please type a question about Mbali's background, education, projects, technical skills, achievements, bursary or career interests."
  }

  const normalizedPreviousQuestion = previousUserQuestion
    ? normalizeChatQuestion(previousUserQuestion)
    : ""
  const contextualQuestion =
    normalizedPreviousQuestion && isContextDependentQuestion(normalizedQuestion)
      ? `${normalizedPreviousQuestion} ${normalizedQuestion}`
      : normalizedQuestion

  const structuredResponse = resolveStructuredChatResponse(contextualQuestion)

  if (structuredResponse) {
    return structuredResponse
  }

  const questionTokens = contextualQuestion.split(" ").filter(Boolean)
  const scoredIntents = knowledgeBase
    .map((intent) => scoreKnowledgeIntent(contextualQuestion, questionTokens, intent))
    .filter(({ score }) => score >= 7)
    .sort((first, second) => {
      if (second.exactPatternMatches !== first.exactPatternMatches) {
        return second.exactPatternMatches - first.exactPatternMatches
      }

      return second.score - first.score
    })

  if (scoredIntents.length === 0) {
    return getFallbackResponse(fallbackVariant)
  }

  const selectedIntents = [scoredIntents[0]]
  const secondIntent = scoredIntents[1]

  if (
    secondIntent &&
    secondIntent.score >= 10 &&
    secondIntent.score >= scoredIntents[0].score - 5 &&
    secondIntent.intent.topic !== scoredIntents[0].intent.topic
  ) {
    selectedIntents.push(secondIntent)
  }

  return selectedIntents
    .map(({ intent }) => {
      const answerIndex = stableAnswerIndex(
        `${contextualQuestion}-${intent.id}`,
        intent.answers.length,
      )

      return intent.answers[answerIndex]
    })
    .join("\n\n")
}


function GithubIcon({
  size = 24,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98 0 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  )
}

function LinkedinIcon({
  size = 24,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  )
}

export default function Portfolio() {
  const [activeSection, setActiveSection] = useState("home")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMobilePerformanceMode, setIsMobilePerformanceMode] = useState(false)
  const [hasHydrated, setHasHydrated] = useState(false)
  const { scrollYProgress } = useScroll()
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])

  const [formData, setFormData] = useState({ name: "", email: "", message: "" })
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Hi! I am Mbali's portfolio assistant. You can ask naturally worded questions such as where she attended high school, what course she studies, when she started university, who funds her studies, which technologies she used, or why she would be a strong candidate.",
    },
  ])
  const [isChatTyping, setIsChatTyping] = useState(false)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextChatMessageIdRef = useRef(2)
  const fallbackResponseIndexRef = useRef(0)
  const answerVariationIndexRef = useRef<Record<string, number>>({})
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null)

  const sections = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "projects", label: "Projects" },
    { id: "skills", label: "Skills" },
    { id: "contact", label: "Contact" },
  ]

  const projects = [
    {
      title: "UniLift Student Transportation Management System",
      description:
        "A full-stack university transportation management system that enables students to request rides while allowing administrators to manage drivers, vehicles and transportation requests.",
      category: "Full-Stack Development",
      categoryColor: "bg-blue-400/20 text-blue-400",
      status: "Completed • 2025",
      statusColor: "bg-green-500/20 text-green-400",
      features: [
        "Responsive dashboards with full CRUD functionality",
        "Role-based authentication for students and administrators",
        "Real-time ride status updates and reporting features",
      ],
      technologies: ["Node.js", "MySQL", "RESTful APIs", "JavaScript"],
      github: "https://github.com/MDyobiso/UniLift-Student-Transportation-Management-System-2025",
      image: "/unilift.png",
    },
    {
      title: "Office Network Design & Implementation",
      description:
        "A secure enterprise network built in Cisco Packet Tracer supporting a scalable, multi-department office environment with redundancy and layered security controls.",
      category: "Network Engineering",
      categoryColor: "bg-red-400/20 text-red-400",
      status: "Completed • 2026",
      statusColor: "bg-green-500/20 text-green-400",
      features: [
        "VLANs, inter-VLAN routing, DHCP, NAT and ACLs",
        "ASA firewalls and a collapsed core architecture",
        "SSH remote management and network segmentation",
      ],
      technologies: ["Cisco Packet Tracer", "VLANs", "ASA Firewall", "Routing"],
      github: "https://github.com/MDyobiso/Office-Network-Design-and-Implementation",
      image: "/network.png",
    },
  ]

  const handleExternalLink = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const skills = {
    Programming: {
      icon: <Code className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      skills: [
        { name: "Java", icon: <Code className="w-4 h-4" /> },
        { name: "Python", icon: <Code className="w-4 h-4" /> },
        { name: "C++", icon: <Terminal className="w-4 h-4" /> },
        { name: "C#", icon: <Code className="w-4 h-4" /> },
      ],
    },
    "Backend & APIs": {
      icon: <Server className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500",
      skills: [
        { name: "Node.js", icon: <Server className="w-4 h-4" /> },
        { name: "Express.js", icon: <Globe className="w-4 h-4" /> },
        { name: "RESTful APIs", icon: <Network className="w-4 h-4" /> },
      ],
    },
    Frontend: {
      icon: <Monitor className="w-6 h-6" />,
      color: "from-indigo-500 to-purple-500",
      skills: [
        { name: "HTML", icon: <Code className="w-4 h-4" /> },
        { name: "CSS", icon: <Palette className="w-4 h-4" /> },
        { name: "JavaScript", icon: <FileText className="w-4 h-4" /> },
        { name: "TypeScript", icon: <FileText className="w-4 h-4" /> },
        { name: "React", icon: <Code className="w-4 h-4" /> },
        { name: "Next.js", icon: <Layers className="w-4 h-4" /> },
      ],
    },
    Databases: {
      icon: <Database className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      skills: [
        { name: "MySQL", icon: <HardDrive className="w-4 h-4" /> },
        { name: "Oracle SQL", icon: <Database className="w-4 h-4" /> },
        { name: "MongoDB", icon: <Database className="w-4 h-4" /> },
      ],
    },
    "Developer Tools": {
      icon: <Tool className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      skills: [
        { name: "GitHub", icon: <GitBranch className="w-4 h-4" /> },
        { name: "VS Code", icon: <Code className="w-4 h-4" /> },
        { name: "Visual Studio", icon: <Code className="w-4 h-4" /> },
        { name: "Packet Tracer", icon: <Network className="w-4 h-4" /> },
      ],
    },
  }

  const sendSms = async (payload: { to: string; body: string }) => {
    try {
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send SMS")
      }

      console.log("✅ SMS sent:", result)
      return result
    } catch (error: any) {
      console.error("❌ SMS Error:", error)
      throw error
    }
  }

  const calculateCharacterCount = (name: string, email: string, message: string) => {
    const fullMessage = `New message from ${name} (${email}):\n\n${message}`
    return fullMessage.length
  }


  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🚀 Form submit triggered") // Debug log

    // Validate form data before submitting
    if (!formData.name || !formData.email || !formData.message) {
      alert("Please fill in all fields")
      return
    }

    setIsFormSubmitting(true)

    try {
      console.log("📤 Sending SMS with data:", formData) // Debug log

      const fullMessage = `New message from ${formData.name} (${formData.email}):\n\n${formData.message}`
      const charCount = fullMessage.length

      if (charCount > 160) {
        // Send the full message first
        const fullSmsPayload = {
          to: "+27638117206",
          body: fullMessage,
        }

        console.log("📦 Full SMS Payload:", fullSmsPayload) // Debug log

        await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullSmsPayload),
        })

        // Then send the notification message
        const notificationPayload = {
          to: "+27638117206",
          body: `Theres a text for you check BSMS from ${formData.name} (${formData.email})`,
        }

        console.log("📦 Notification SMS Payload:", notificationPayload) // Debug log

        const response = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(notificationPayload),
        })

        console.log("📨 Response status:", response.status) // Debug log

        const result = await parseResponse(response)
        console.log("📨 Response data:", result) // Debug log

        if (!response.ok) {
          throw new Error(result.error || "Failed to send SMS")
        }
      } else {
        // Send as normal if under 160 characters
        const smsPayload = {
          to: "+27638117206",
          body: fullMessage,
        }

        console.log("📦 SMS Payload:", smsPayload) // Debug log

        const response = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(smsPayload),
        })

        console.log("📨 Response status:", response.status) // Debug log

        const result = await parseResponse(response)
        console.log("📨 Response data:", result) // Debug log

        if (!response.ok) {
          throw new Error(result.error || "Failed to send SMS")
        }
      }

      setFormSubmitted(true)
      setFormData({ name: "", email: "", message: "" })

      // Hide the "Message Sent" confirmation after 5 seconds
      setTimeout(() => setFormSubmitted(false), 5000)
    } catch (error: any) {
      console.error("❌ Error:", error) // Debug log
      alert("Error sending message: " + error.message)
    } finally {
      setIsFormSubmitting(false)
    }
  }



  const typeAssistantMessage = (messageId: number, fullAnswer: string) => {
    let characterIndex = 0

    const typeNextCharacter = () => {
      characterIndex += 1

      setChatMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: fullAnswer.slice(0, characterIndex),
                isTyping: characterIndex < fullAnswer.length,
              }
            : message,
        ),
      )

      if (characterIndex < fullAnswer.length) {
        const currentCharacter = fullAnswer[characterIndex - 1]
        const typingDelay =
          currentCharacter === "." || currentCharacter === "!" || currentCharacter === "?"
            ? 90
            : currentCharacter === "," || currentCharacter === ":" || currentCharacter === ";"
              ? 45
              : currentCharacter === " "
                ? 14
                : 8

        typingTimerRef.current = setTimeout(typeNextCharacter, typingDelay)
        return
      }

      typingTimerRef.current = null
      setIsChatTyping(false)
    }

    typingTimerRef.current = setTimeout(typeNextCharacter, 320)
  }

  const stopAssistantTyping = () => {
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = null
    }

    setIsChatTyping(false)
    setChatMessages((currentMessages) =>
      currentMessages.map((message) =>
        message.isTyping
          ? {
              ...message,
              content: message.content || "Response stopped.",
              isTyping: false,
            }
          : message,
      ),
    )
  }

  const submitChatQuestion = (question: string) => {
    const trimmedQuestion = question.trim()

    if (!trimmedQuestion || isChatTyping) {
      return
    }

    const userMessageId = nextChatMessageIdRef.current
    const assistantMessageId = userMessageId + 1
    nextChatMessageIdRef.current += 2

    const previousUserQuestion = [...chatMessages]
      .reverse()
      .find((message) => message.role === "user")?.content
    const baseAnswer = getChatbotResponse(
      trimmedQuestion,
      previousUserQuestion,
      fallbackResponseIndexRef.current,
    )
    fallbackResponseIndexRef.current += 1

    const answerKey = normalizeChatQuestion(baseAnswer)
    const currentVariationIndex = answerVariationIndexRef.current[answerKey] ?? 0
    answerVariationIndexRef.current[answerKey] = currentVariationIndex + 1

    const answer = isFallbackChatResponse(baseAnswer)
      ? baseAnswer
      : applyAnswerVariation(baseAnswer, currentVariationIndex)

    setChatMessages((currentMessages) => [
      ...currentMessages,
      {
        id: userMessageId,
        role: "user",
        content: trimmedQuestion,
      },
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        isTyping: true,
      },
    ])
    setChatInput("")
    setIsChatTyping(true)
    typeAssistantMessage(assistantMessageId, answer)
  }

  const handleChatSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitChatQuestion(chatInput)
  }

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!isChatOpen) {
      return
    }

    chatMessagesEndRef.current?.scrollIntoView({
      behavior: isChatTyping ? "auto" : "smooth",
      block: "end",
    })
  }, [chatMessages, isChatOpen, isChatTyping])

  useEffect(() => {
    if (!isChatOpen) {
      return
    }

    const scrollPosition = window.scrollY
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalBodyOverflow = document.body.style.overflow
    const originalBodyPosition = document.body.style.position
    const originalBodyTop = document.body.style.top
    const originalBodyWidth = document.body.style.width

    document.documentElement.style.overflow = "hidden"
    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollPosition}px`
    document.body.style.width = "100%"

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow
      document.body.style.overflow = originalBodyOverflow
      document.body.style.position = originalBodyPosition
      document.body.style.top = originalBodyTop
      document.body.style.width = originalBodyWidth
      window.scrollTo(0, scrollPosition)
    }
  }, [isChatOpen])

  const handleDownloadCV = () => {
    const link = document.createElement("a")
    link.href = "/CV_MbaliDyobiso.pdf"
    link.download = "CV_MbaliDyobiso.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    // Keep client-only decorative elements out of the server HTML so React
    // hydrates against exactly the same tree on the first client render.
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)")

    const updateMobilePerformanceMode = () => {
      setIsMobilePerformanceMode(mobileQuery.matches)
    }

    updateMobilePerformanceMode()
    mobileQuery.addEventListener("change", updateMobilePerformanceMode)

    return () => {
      mobileQuery.removeEventListener("change", updateMobilePerformanceMode)
    }
  }, [])

  useEffect(() => {
    let frameId: number | null = null

    const updateActiveSection = () => {
      frameId = null
      const pageSections = ["home", "about", "projects", "skills", "contact"]
      const scrollPosition = window.scrollY + 100

      for (const section of pageSections) {
        const element = document.getElementById(section)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    const handleScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(updateActiveSection)
      }
    }

    updateActiveSection()
    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId)
      }
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode)
  }, [isDarkMode])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setIsMenuOpen(false)
  }

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`min-h-screen transition-colors duration-300 ${isDarkMode
          ? "bg-linear-to-br from-slate-900 via-purple-900 to-slate-900"
          : "bg-linear-to-br from-blue-50 via-purple-50 to-pink-50"
        }`}
    >
      {/* Background Floating Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large floating shapes - more visible */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl"
          animate={isMobilePerformanceMode ? undefined : {
            y: [0, -50, 0],
            x: [0, 30, 0],
            scale: [1, 1.3, 1],
          }}
          transition={isMobilePerformanceMode ? undefined : {
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-2xl"
          animate={isMobilePerformanceMode ? undefined : {
            y: [0, 60, 0],
            x: [0, -40, 0],
            scale: [1, 0.7, 1],
          }}
          transition={isMobilePerformanceMode ? undefined : {
            duration: 15,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-pink-500/25 rounded-full blur-2xl"
          animate={isMobilePerformanceMode ? undefined : {
            y: [0, -40, 0],
            x: [0, 25, 0],
            scale: [1, 1.4, 1],
          }}
          transition={isMobilePerformanceMode ? undefined : {
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 6,
          }}
        />
        <motion.div
          className="absolute top-3/4 right-1/3 w-56 h-56 bg-cyan-500/18 rounded-full blur-2xl"
          animate={isMobilePerformanceMode ? undefined : {
            y: [0, -35, 0],
            x: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={isMobilePerformanceMode ? undefined : {
            duration: 14,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 8,
          }}
        />

        {/* Floating particles - more visible */}
        {hasHydrated &&
          FLOATING_PARTICLES.map((particle, index) => (
            <motion.div
              key={`${particle.left}-${particle.top}`}
              className="absolute w-2 h-2 bg-purple-400/40 rounded-full blur-sm"
              style={{
                left: particle.left,
                top: particle.top,
              }}
              animate={isMobilePerformanceMode ? undefined : {
                y: [0, -150, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={isMobilePerformanceMode ? undefined : {
                duration: particle.duration,
                repeat: Number.POSITIVE_INFINITY,
                delay: particle.delay,
              }}
            />
          ))}
      </div>

      {/* Navigation */}
      <motion.nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${isDarkMode
            ? "bg-black/20 backdrop-blur-md border-b border-white/10"
            : "bg-white/20 backdrop-blur-md border-b border-black/10"
          }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <motion.div
              className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
              whileHover={{ scale: 1.05 }}
            >
              Mbali Dyobiso
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`text-sm font-medium transition-colors duration-200 ${activeSection === section.id
                      ? "text-purple-400"
                      : isDarkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {section.label}
                </button>
              ))}

              {/* Theme Toggle */}
              <div className="flex items-center space-x-2 ml-4">
                <Sun className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-yellow-500"}`} />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                  className="data-[state=checked]:bg-purple-600 [&>span]:bg-white dark:[&>span]:bg-gray-200"
                />
                <Moon className={`h-4 w-4 ${isDarkMode ? "text-blue-400" : "text-gray-400"}`} />
              </div>
            </div>

            {/* Mobile Navigation Toggle */}
            <div className="md:hidden flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sun className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-yellow-500"}`} />
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={setIsDarkMode}
                  className="data-[state=checked]:bg-purple-600 [&>span]:bg-white dark:[&>span]:bg-gray-200"
                />
                <Moon className={`h-4 w-4 ${isDarkMode ? "text-blue-400" : "text-gray-400"}`} />
              </div>
              <button
                className={isDarkMode ? "text-white" : "text-gray-900"}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <motion.div
            className={`md:hidden ${isDarkMode ? "bg-black/90" : "bg-white/90"} backdrop-blur-md`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-4 py-2 space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`block w-full text-left py-2 transition-colors ${activeSection === section.id
                      ? "text-purple-400"
                      : isDarkMode
                        ? "text-gray-300 hover:text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                  {section.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* Hero Section */}
      <section
        id="home"
        className={`min-h-screen flex items-center justify-center relative overflow-hidden py-20 border-b ${isDarkMode ? "border-slate-700/50" : "border-gray-200"}`}
      >
        <motion.div className="absolute inset-0 z-0" style={isMobilePerformanceMode ? undefined : { y: backgroundY }}>
          <div
            className={`absolute inset-0 ${isDarkMode
                ? "bg-linear-to-r from-purple-600/20 to-blue-600/20"
                : "bg-linear-to-r from-purple-200/40 to-blue-200/40"
              }`}
          />
        </motion.div>

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center">
          {/* Centered Hero Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full flex flex-col items-center text-center"
          >
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 mb-4 px-3 py-1 rounded-full text-sm">
              Available for Opportunities
            </Badge>
            <h1
              className={`text-5xl md:text-6xl lg:text-7xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              BSc IT Student & <span className="text-purple-400">Software Developer</span>
            </h1>
            <p className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
              BSc Information Technology student with a strong foundation in software development, systems design and networking, motivated to build efficient, scalable and user-focused digital solutions.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Button
                size="lg"
                className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={handleDownloadCV}
              >
                <Download className="mr-2" size={18} />
                Download CV
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={`border-gray-400 ${isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                onClick={() => scrollToSection("contact")}
              >
                <Phone className="mr-2" size={18} />
                Get in Touch
              </Button>
            </div>
            <div className={`flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}>
              <div className="flex items-center gap-2">
                <MapPin className="text-purple-400" size={16} />
                <span>Klerksdorp, North West</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="text-purple-400" size={16} />
                <span>Expected Completion: 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="text-purple-400" size={16} />
                <span>BSc IT @ NWU</span>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <motion.button
                onClick={() => handleExternalLink('https://github.com/MDyobiso?tab=repositories')}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-full transition-colors ${isDarkMode
                    ? "bg-slate-800 text-gray-300 hover:bg-purple-600 hover:text-white"
                    : "bg-white text-gray-600 hover:bg-purple-600 hover:text-white shadow-md"
                  }`}
              >
                <GithubIcon size={24} />
              </motion.button>
              <motion.button
                onClick={() => handleExternalLink('https://www.linkedin.com/')}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-full transition-colors ${isDarkMode
                    ? "bg-slate-800 text-purple-400 hover:bg-purple-600 hover:text-white"
                    : "bg-white text-purple-600 hover:bg-purple-600 hover:text-white shadow-md"
                  }`}
              >
                <LinkedinIcon size={24} />
              </motion.button>
              <motion.button
                onClick={() => window.open('mailto:mbali.dyobisoentle@gmail.com')}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                className={`p-3 rounded-full transition-colors ${isDarkMode
                    ? "bg-slate-800 text-purple-400 hover:bg-purple-600 hover:text-white"
                    : "bg-white text-purple-600 hover:bg-purple-600 hover:text-white shadow-md"
                  }`}
              >
                <Mail size={24} />
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Animated Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={isMobilePerformanceMode ? undefined : { y: [0, 10, 0] }}
          transition={
            isMobilePerformanceMode
              ? undefined
              : { duration: 2, repeat: Number.POSITIVE_INFINITY }
          }
        >
          <ChevronDown className={`${isDarkMode ? "text-white/60" : "text-gray-600/60"}`} size={32} />
        </motion.div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className={`py-20 px-4 ${isDarkMode ? "bg-slate-950/30" : "bg-gray-100"} border-b ${isDarkMode ? "border-slate-700/50" : "border-gray-200"}`}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobilePerformanceMode ? 0 : 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl font-bold text-center mb-16 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              About Me
            </h2>
            <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
              <div className="flex justify-center">
                <div className="relative mx-auto h-64 w-64 sm:h-72 sm:w-72 md:h-96 md:w-96">
                  <img
                    src="/IMG.jpg"
                    alt="Mbali Dyobiso - BSc IT Student and Software Developer"
                    className="h-full w-full rounded-full border-4 border-purple-400/50 object-cover object-top shadow-2xl md:scale-75 dark:border-purple-500/60"
                    style={{ objectPosition: "center 15%" }}
                  />
                </div>
              </div>
              <div
                className={`mx-auto w-full max-w-xl space-y-6 px-1 md:mx-0 md:px-0 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                <p className="text-justify text-base leading-relaxed sm:text-lg md:text-left">
                  I am a BSc Information Technology student with a strong academic foundation in software development, systems design and networking.
                </p>
                <p className="text-justify text-base leading-relaxed sm:text-lg md:text-left">
                  My academic training has equipped me to build efficient, scalable and user-focused applications. I am highly motivated to apply my technical expertise within a high-performance environment while continuously developing as an IT professional.
                </p>
              </div>
            </div>

            {/* Academic Background & Certificates Section */}
            <div className="mt-12 md:mt-16">
              <div className="grid md:grid-cols-2 gap-8 relative">
                {/* Vertical divider line - Fixed */}
                <div
                  className={`absolute left-1/2 top-0 bottom-0 w-0.5 transform -translate-x-1/2 hidden md:block ${isDarkMode
                      ? "bg-linear-to-b from-purple-400/30 via-purple-500/60 to-purple-400/30"
                      : "bg-linear-to-b from-purple-400/40 via-purple-500/70 to-purple-400/40"
                    }`}
                  style={{ minHeight: '100%', height: 'auto' }}
                />

                {/* Left Column: Academic Background */}
                <div>
                  <h3 className={`text-2xl font-bold mb-8 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                    Academic Background
                  </h3>
                  <Card
                    className={`${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"} h-full relative`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-purple-400">Bachelor of Science (BSc) in Information Technology</CardTitle>
                          <CardDescription className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            In Progress • North-West University — Vanderbijlpark Campus
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        Building a strong foundation in software development, systems design, networking, databases and user-focused application development.
                      </p>
                      {/* GPA Badge */}
                      <div className="mt-4">
                        <Badge
                          className={`
                            ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-200 text-gray-800"}
                            transition-colors cursor-pointer hover:opacity-80
                          `}
                        >
                          Expected completion: November 2026
                        </Badge>
                      </div>
                      {/* High School Education */}
                      <div
                        className={`mt-8 border-t pt-6 ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}
                      >
                        <CardTitle className="text-purple-400">
                          National Senior Certificate (Matric)
                        </CardTitle>
                        <CardDescription className={`mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Completed • Milner High School
                        </CardDescription>
                        <p className={`mt-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          Completed high school education at Milner High School from 2018 to 2022.
                        </p>
                        <div className="mt-4">
                          <Badge
                            className={`
                              ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-200 text-gray-800"}
                              transition-colors cursor-pointer hover:opacity-80
                            `}
                          >
                            2018 – 2022
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Achievements and Core Competencies */}
                <div className="space-y-10 pt-10 md:pt-0">
                  <div className="relative z-20 block w-full">
                    <h3 className={`relative z-20 block w-full text-2xl font-bold mb-8 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Achievements
                    </h3>
                    <motion.div
                      initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: isMobilePerformanceMode ? 0 : 0.6 }}
                      viewport={{ once: true }}
                      className={`${isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-white/50 border-gray-200"
                        } p-4 rounded-lg border`}
                    >
                      <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                        Introduction to Cybersecurity Certificate — Cisco Networking Academy (2025)
                      </p>
                    </motion.div>
                  </div>

                  <div>
                    <h3 className={`text-2xl font-bold mb-8 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Core Competencies
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {["Adaptability", "Time Management", "Team Collaboration", "Communication", "Problem-solving", "Continuous Learning"].map(
                        (competency, index) => (
                          <motion.div
                            key={competency}
                            initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: isMobilePerformanceMode ? 0 : 0.6,
                              delay: isMobilePerformanceMode ? 0 : index * 0.08,
                            }}
                            viewport={{ once: true }}
                            className={`${isDarkMode ? "bg-slate-800/30 border-slate-700" : "bg-white/50 border-gray-200"
                              } p-4 rounded-lg border`}
                          >
                            <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>{competency}</p>
                          </motion.div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section
        id="projects"
        className={`py-20 px-4 ${isDarkMode ? "bg-slate-900/50" : "bg-white"} border-b ${isDarkMode ? "border-slate-700/50" : "border-gray-200"}`}
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobilePerformanceMode ? 0 : 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl font-bold text-center mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              My Projects
            </h2>
            <p
              className={`text-lg text-center mb-16 max-w-2xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              These academic projects demonstrate my practical experience in full-stack application development, database-backed systems and secure enterprise network design.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
              {projects.map((project, index) => (
                <motion.div
                  key={index}
                  initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: isMobilePerformanceMode ? 0 : 0.6,
                    delay: isMobilePerformanceMode ? 0 : index * 0.1,
                  }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <Card
                    className={`h-full flex flex-col ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"
                      }`}
                  >
                    <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                      {project.image ? (
                        <img
                          src={project.image || "/placeholder.svg"}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? "bg-slate-700" : "bg-gray-200"
                          }`}>
                          <span className={`text-2xl font-bold ${isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}>
                            Coming Soon
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className={project.categoryColor}>{project.category}</Badge>
                        <Badge className={project.statusColor}>{project.status}</Badge>
                      </div>
                    </div>
                    <CardHeader className="grow">
                      <CardTitle className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {project.title}
                      </CardTitle>
                      <CardDescription className={`${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {project.description}
                      </CardDescription>
                      <div className="mt-4 space-y-2">
                        <h4
                          className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                        >
                          <Zap size={18} className="text-purple-400" />
                          Key Features
                        </h4>
                        <Separator className={isDarkMode ? "bg-slate-600" : "bg-gray-300"} />
                        <ul className="space-y-1 text-sm">
                          {project.features.map((feature, featureIndex) => (
                            <li
                              key={featureIndex}
                              className={`flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
                            >
                              <CheckCircle size={16} className="text-green-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-4 space-y-2">
                        <h4
                          className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
                        >
                          <Code size={18} className="text-purple-400" />
                          Tech Stack
                        </h4>
                        <Separator className={isDarkMode ? "bg-slate-600" : "bg-gray-300"} />
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech, techIndex) => (
                            <Badge
                              key={techIndex}
                              className={`
                              ${isDarkMode ? "bg-slate-700 text-white" : "bg-gray-200 text-gray-800"}
                              transition-colors cursor-pointer hover:opacity-80
                            `}
                            >
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="mt-auto pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className={`w-full border-gray-400 ${isDarkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                          onClick={() => handleExternalLink(project.github)}
                        >
                          <GithubIcon size={18} className="mr-2" />
                          Source Code
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            {/* View All Projects Button */}
            <motion.div
              className="mt-16 text-center"
              initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: isMobilePerformanceMode ? 0 : 0.6,
                delay: isMobilePerformanceMode ? 0 : 0.2,
              }}
              viewport={{ once: true }}
            >
              <Button
                type="button"
                variant="outline"
                className={`px-8 py-3 text-lg ${isDarkMode
                    ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                    : "bg-white border-gray-300 text-gray-800 hover:bg-gray-100"
                  }`}
                onClick={() =>
                  handleExternalLink("https://github.com/MDyobiso?tab=repositories")
                }
              >
                <Rocket className="mr-2" size={20} />
                View All Projects on GitHub
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Skills Section */}
      <section
        id="skills"
        className={`py-20 px-4 ${isDarkMode ? "bg-slate-950/30" : "bg-gray-100"} border-b ${isDarkMode ? "border-slate-700/50" : "border-gray-200"}`}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobilePerformanceMode ? 0 : 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl font-bold text-center mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Skills & Technologies
            </h2>
            <p
              className={`text-lg text-center mb-16 max-w-3xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              A comprehensive overview of my technical expertise across various domains of software development, from
              frontend frameworks to backend systems and development tools.
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(skills).map(([category, categoryData], index) => (
                <motion.div
                  key={category}
                  initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: isMobilePerformanceMode ? 0 : 0.6,
                    delay: isMobilePerformanceMode ? 0 : index * 0.1,
                  }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <Card
                    className={`${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"
                      } h-full hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-xl bg-linear-to-r ${categoryData.color} text-white shadow-lg`}>
                          {categoryData.icon}
                        </div>
                        <CardTitle className={`text-xl ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {category}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {categoryData.skills.map((skill, skillIndex) => (
                          <motion.div
                            key={skillIndex}
                            initial={isMobilePerformanceMode ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: isMobilePerformanceMode ? 0 : 0.4,
                              delay: isMobilePerformanceMode ? 0 : skillIndex * 0.05,
                            }}
                            viewport={{ once: true }}
                            whileHover={{ scale: 1.05 }}
                            className="group/skill"
                          >
                            <div
                              className={`flex items-center gap-3 p-3 rounded-lg ${isDarkMode ? "bg-slate-700/50 hover:bg-slate-700" : "bg-gray-100 hover:bg-gray-200"} transition-all duration-200`}
                            >
                              <div
                                className={`p-2 rounded-md ${isDarkMode ? "bg-slate-600" : "bg-white"} group-hover/skill:bg-purple-500 transition-colors`}
                              >
                                {skill.icon}
                              </div>
                              <span className={`font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                                {skill.name}
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className={`py-20 px-4 ${isDarkMode ? "bg-slate-900/50" : "bg-white"}`}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={isMobilePerformanceMode ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobilePerformanceMode ? 0 : 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className={`text-4xl font-bold text-center mb-16 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Get In Touch
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className={`text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  Let's Connect
                </h3>
                <p className={`mb-8 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                  I'm always interested in new opportunities and exciting projects. Whether you have a question or just
                  want to say hi, feel free to reach out!
                </p>
                <div className="space-y-4">
                  <a href="mailto:mbali.dyobisoentle@gmail.com" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    <Mail className="text-purple-400" size={20} />
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>mbali.dyobisoentle@gmail.com</span>
                  </a>
                  <a href="tel:+27638117206" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    <Phone className="text-purple-400" size={20} />
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>+27 63 811 7206</span>
                  </a>
                  <div className="flex items-center gap-4">
                    <MapPin className="text-purple-400" size={20} />
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                      Klerksdorp, North West
                    </span>
                  </div>
                  <a href="mailto:Bongisa.Dyosoba@nwu.ac.za" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
                    <Briefcase className="text-purple-400" size={20} />
                    <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                      Bongisa Dyosoba — Module Facilitator (NWU)
                    </span>
                  </a>
                </div>
                <div className="flex gap-4 mt-8">
                  <motion.button
                    onClick={() => handleExternalLink('https://github.com/Shakira2022')}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-3 rounded-full transition-colors ${isDarkMode
                        ? "bg-slate-800 text-purple-400 hover:bg-purple-600 hover:text-white"
                        : "bg-white text-purple-600 hover:bg-purple-600 hover:text-white shadow-md"
                      }`}
                  >
                    <GithubIcon size={24} />
                  </motion.button>
                  <motion.button
                    onClick={() => handleExternalLink('https://www.linkedin.com/')}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    className={`p-3 rounded-full transition-colors ${isDarkMode
                        ? "bg-slate-800 text-purple-400 hover:bg-purple-600 hover:text-white"
                        : "bg-white text-purple-600 hover:bg-purple-600 hover:text-white shadow-md"
                      }`}
                  >
                    <LinkedinIcon size={24} />
                  </motion.button>
                </div>
              </div>
              <Card
                className={`${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-gray-200"} shadow-xl`}
              >
                <CardHeader>
                  <CardTitle className={`${isDarkMode ? "text-purple-400" : "text-purple-600"}`}>
                    Send Message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {formSubmitted ? (
                      <motion.div
                        initial={isMobilePerformanceMode ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="text-center py-8"
                      >
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          Message Sent!
                        </h3>
                        <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                          Thank you for reaching out. I'll get back to you soon!
                        </p>
                      </motion.div>
                    ) : (
                      <motion.form
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                        onSubmit={handleFormSubmit}
                      >
                        <div>
                          <Label htmlFor="name" className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className={`${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-gray-50 border-gray-300"}`}
                            placeholder="Your name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                            className={`${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-gray-50 border-gray-300"}`}
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="message" className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                            Message
                          </Label>
                          <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                            className={`${isDarkMode ? "bg-slate-700 border-slate-600 text-white" : "bg-gray-50 border-gray-300"} min-h-30`}
                            placeholder="Your message..."
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isFormSubmitting}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          {isFormSubmitting ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              className="mr-2 inline-block"
                            >
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                            </motion.div>
                          ) : (
                            <Send className="mr-2 h-4 w-4 inline-block" />
                          )}
                          {isFormSubmitting ? "Sending..." : "Send Message"}
                        </Button>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>


      {/* Portfolio AI Chatbot */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsChatOpen(false)}
            className="fixed inset-0 z-[60] cursor-default touch-none overscroll-none bg-black/45 backdrop-blur-sm"
            aria-label="Close Mbali portfolio assistant overlay"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-3 z-[70] flex flex-col items-end sm:bottom-6 sm:right-6">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              role="dialog"
              aria-modal="true"
              aria-label="Mbali portfolio assistant"
              className={`mb-3 flex h-[calc(100dvh-7rem)] max-h-[720px] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border shadow-2xl sm:h-[640px] sm:w-[440px] md:w-[520px] lg:w-[560px] ${
                isDarkMode
                  ? "border-slate-700 bg-slate-900 text-white"
                  : "border-gray-200 bg-white text-gray-900"
              }`}
            >
              <div className="flex shrink-0 items-center justify-between bg-linear-to-r from-blue-600 to-purple-600 px-4 py-3.5 text-white sm:px-5 sm:py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="shrink-0 rounded-full bg-white/20 p-2.5">
                    <Bot size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold sm:text-lg">Mbali Portfolio Assistant</p>
                    <p className="truncate text-xs text-white/80 sm:text-sm">
                      Ask about Mbali's profile, skills and career
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="ml-3 shrink-0 rounded-full p-2 transition-colors hover:bg-white/20"
                  aria-label="Close portfolio assistant"
                >
                  <X size={21} />
                </button>
              </div>

              <div className={`shrink-0 border-b px-3 py-3 sm:px-4 ${isDarkMode ? "border-slate-700" : "border-gray-200"}`}>
                <p className={`mb-2 text-xs font-medium sm:text-sm ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}>
                  Suggested questions
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {chatbotSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      disabled={isChatTyping}
                      onClick={() => submitChatQuestion(suggestion)}
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${
                        isDarkMode
                          ? "border-slate-600 bg-slate-800 text-gray-200 hover:bg-slate-700"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 ${isDarkMode ? "bg-slate-950/60" : "bg-gray-50"}`}>
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed sm:max-w-[86%] sm:text-[15px] ${
                        message.role === "user"
                          ? "rounded-br-sm bg-purple-600 text-white"
                          : isDarkMode
                            ? "rounded-bl-sm border border-slate-700 bg-slate-800 text-gray-200"
                            : "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                      }`}
                    >
                      {message.isTyping && !message.content ? (
                        <span className="inline-flex items-center gap-1 py-1" aria-label="Assistant is typing">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                        </span>
                      ) : (
                        <>
                          {message.content}
                          {message.isTyping && (
                            <span className="ml-0.5 inline-block animate-pulse font-bold">▍</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatMessagesEndRef} />
              </div>

              <form
                onSubmit={handleChatSubmit}
                className={`flex shrink-0 items-center gap-2 border-t p-3 sm:p-4 ${isDarkMode ? "border-slate-700 bg-slate-900" : "border-gray-200 bg-white"}`}
              >
                <Input
                  value={chatInput}
                  disabled={isChatTyping}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={isChatTyping ? "Mbali's assistant is typing..." : "Ask a question about Mbali..."}
                  className={isDarkMode ? "border-slate-600 bg-slate-800 text-white" : "bg-gray-50"}
                  aria-label="Ask the portfolio assistant a question"
                />
                <Button
                  type={isChatTyping ? "button" : "submit"}
                  size="icon"
                  disabled={!isChatTyping && !chatInput.trim()}
                  onClick={isChatTyping ? stopAssistantTyping : undefined}
                  className={`shrink-0 text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    isChatTyping
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                  aria-label={isChatTyping ? "Stop assistant response" : "Send question"}
                  title={isChatTyping ? "Stop response" : "Send question"}
                >
                  {isChatTyping ? <Square size={17} fill="currentColor" /> : <Send size={18} />}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!isChatOpen && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.18 }}
              onClick={() => setIsChatOpen(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-xl transition-shadow hover:shadow-2xl sm:h-16 sm:w-16"
              aria-label="Open Mbali portfolio assistant"
            >
              <MessageCircle size={27} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer
        className={`py-8 px-4 border-t ${isDarkMode ? "bg-black/40 border-slate-700" : "bg-white border-gray-200"}`}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            © {new Date().getFullYear()} Mbali Dyobiso. Built with Next.js and Tailwind CSS.
          </p>
        </div>
      </footer>
      </div>
    </MotionConfig>
  )
}
