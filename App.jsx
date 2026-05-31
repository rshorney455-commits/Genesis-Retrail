import { useState, useMemo, useEffect, useRef } from "react";

// ── Sector averages by location type ─────────────────────────────────────────
const SECTOR = {
  "city-centre": {
    footfall:600, avgBasket:5.50,
    staffPct:10, utilities:12000, otherCosts:9000,
    spendBands:{u5:35,s5:38,s10:15,s15:8,s20:4},
    missions:{"Top-up":30,"Grab and Go":35,"Treat or Impulse":15,"Food to Go":15,"Big Shop Supplement":5},
    fhour:{"6-8am":8,"8-10am":18,"10-12pm":10,"12-2pm":22,"2-4pm":10,"4-6pm":18,"6-8pm":10,"8-10pm":4},
  },
  "suburban": {
    footfall:400, avgBasket:6.80,
    staffPct:9, utilities:9000, otherCosts:8000,
    spendBands:{u5:25,s5:38,s10:22,s15:10,s20:5},
    missions:{"Top-up":42,"Grab and Go":22,"Treat or Impulse":15,"Food to Go":8,"Big Shop Supplement":13},
    fhour:{"6-8am":4,"8-10am":14,"10-12pm":12,"12-2pm":16,"2-4pm":12,"4-6pm":18,"6-8pm":16,"8-10pm":8},
  },
  "village": {
    footfall:250, avgBasket:8.00,
    staffPct:9, utilities:7500, otherCosts:7000,
    spendBands:{u5:15,s5:30,s10:28,s15:17,s20:10},
    missions:{"Top-up":45,"Grab and Go":18,"Treat or Impulse":12,"Food to Go":5,"Big Shop Supplement":20},
    fhour:{"6-8am":3,"8-10am":12,"10-12pm":15,"12-2pm":14,"2-4pm":13,"4-6pm":16,"6-8pm":18,"8-10pm":9},
  },
  "parade": {
    footfall:350, avgBasket:7.00,
    staffPct:9, utilities:8500, otherCosts:7500,
    spendBands:{u5:20,s5:36,s10:24,s15:13,s20:7},
    missions:{"Top-up":40,"Grab and Go":25,"Treat or Impulse":15,"Food to Go":8,"Big Shop Supplement":12},
    fhour:{"6-8am":4,"8-10am":13,"10-12pm":14,"12-2pm":17,"2-4pm":12,"4-6pm":18,"6-8pm":16,"8-10pm":6},
  },
  "forecourt": {
    footfall:500, avgBasket:6.00,
    staffPct:11, utilities:14000, otherCosts:10000,
    spendBands:{u5:40,s5:36,s10:14,s15:7,s20:3},
    missions:{"Top-up":25,"Grab and Go":40,"Treat or Impulse":18,"Food to Go":14,"Big Shop Supplement":3},
    fhour:{"6-8am":10,"8-10am":16,"10-12pm":12,"12-2pm":14,"2-4pm":12,"4-6pm":16,"6-8pm":14,"8-10pm":6},
  },
};

const CATS0 = [
  {name:"Tobacco & Vaping",    mix:22, gp:8,  icon:"🚬"},
  {name:"Soft Drinks & Water", mix:12, gp:28, icon:"🥤"},
  {name:"Alcohol",             mix:11, gp:22, icon:"🍺"},
  {name:"Confectionery",       mix:9,  gp:32, icon:"🍫"},
  {name:"Grocery & Ambient",   mix:9,  gp:25, icon:"🛒"},
  {name:"Chilled & Dairy",     mix:8,  gp:27, icon:"🥛"},
  {name:"Snacks & Crisps",     mix:7,  gp:30, icon:"🍟"},
  {name:"News & Mags",         mix:5,  gp:24, icon:"📰"},
  {name:"Frozen",              mix:4,  gp:29, icon:"🧊"},
  {name:"Hot Beverages",       mix:4,  gp:55, icon:"☕"},
  {name:"Health & Beauty",     mix:3,  gp:38, icon:"💊"},
  {name:"Lottery & Services",  mix:3,  gp:6,  icon:"🎟️"},
  {name:"Other / Impulse",     mix:3,  gp:33, icon:"⭐"},
];
const REFITS = [
  {label:"Light Refresh",   value:35000,  desc:"Signage, lighting, fixtures"},
  {label:"Mid Refit",       value:75000,  desc:"Full shopfit, chillers, office"},
  {label:"Full Conversion", value:130000, desc:"Strip-out, build, all equipment"},
  {label:"Premium Symbol",  value:200000, desc:"Full spec + ATM/PayPoint"},
];
const AGE_BANDS   = ["Under 18","18-24","25-34","35-44","45-54","55-64","65+"];
const EMPLOYMENTS = ["Employed Full-Time","Employed Part-Time","Self-Employed","Unemployed","Retired","Student"];
const HOUSINGS    = ["Owner Occupied","Private Rented","Social / Council","Other"];
const TRENDS      = ["Rising Rapidly","Rising Steadily","Stable","Declining Slightly","Declining Rapidly"];
const TCOLORS     = {"Rising Rapidly":"#2d6a4f","Rising Steadily":"#40916c","Stable":"#e07020","Declining Slightly":"#c05010","Declining Rapidly":"#d62828"};
const FHOURS      = ["6-8am","8-10am","10-12pm","12-2pm","2-4pm","4-6pm","6-8pm","8-10pm"];
const SBANDS      = [{label:"Under £5",key:"u5"},{label:"£5-£9.99",key:"s5"},{label:"£10-£14.99",key:"s10"},{label:"£15-£19.99",key:"s15"},{label:"£20+",key:"s20"}];
const MISSIONS    = ["Top-up","Grab and Go","Treat or Impulse","Food to Go","Big Shop Supplement"];
const TRAFFIC_F   = [
  {k:"roadVehicles",l:"Road vehicles / day",   h:"Total passing cars and vans", num:true},
  {k:"pedestrians", l:"Pedestrians / day",     h:"Footway count",               num:true},
  {k:"cyclists",    l:"Cyclists / day",        h:"Cycle lane or road",          num:true},
  {k:"busStop",     l:"Bus stop within 50m",   h:"",                            num:false},
  {k:"trainStation",l:"Train station 5 min",   h:"",                            num:false},
  {k:"school",      l:"School nearby",         h:"Within 400m",                 num:false},
  {k:"office",      l:"Office / industrial",   h:"Significant employer nearby", num:false},
];
const STEPS = ["Cover","Property","Costs","Refit","Categories","Demographics","Spend","Traffic","Results"];
const fmt = n => new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(n);
const pct = n => n.toFixed(1)+"%";

const G = {
  bg:"#ffffff", card:"#f4f9f6", border:"#b7d5c4",
  text:"#1a3d2b", dark:"#1a3d2b", mid:"#2d6a4f", light:"#40916c", pale:"#d8ede3",
  orange:"#e07020", obg:"#fff4ea",
};

// Orange = manual input, Green = sector average (overridable)
const INP_manual = {width:"100%",padding:"12px 14px",background:"#fff4ea",border:"1.5px solid #e07020",borderRadius:8,color:"#e07020",fontFamily:"inherit",fontSize:16,outline:"none",WebkitAppearance:"none",appearance:"none",fontWeight:600};
const INP_auto   = {width:"100%",padding:"12px 14px",background:"#f0faf4",border:"1.5px solid #40916c",borderRadius:8,color:"#2d6a4f",fontFamily:"inherit",fontSize:16,outline:"none",WebkitAppearance:"none",appearance:"none",fontWeight:600};

function Legend(){
  return (
    <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20,padding:"10px 14px",background:G.card,borderRadius:8,border:"1px solid "+G.border}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:14,height:14,borderRadius:3,background:"#fff4ea",border:"1.5px solid #e07020",flexShrink:0}}/>
        <span style={{fontSize:12,color:G.text}}>You fill in on the visit</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:14,height:14,borderRadius:3,background:"#f0faf4",border:"1.5px solid #40916c",flexShrink:0}}/>
        <span style={{fontSize:12,color:G.text}}>Sector average — override if needed</span>
      </div>
    </div>
  );
}

// ── Chart components ──────────────────────────────────────────────────────────
function BarChart({data,color,height,fv}){
  color=color||G.mid; height=height||180;
  const max=Math.max(...data.map(d=>d.v),1);
  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:height,borderBottom:"2px solid "+G.border,borderLeft:"2px solid "+G.border,padding:"0 4px"}}>
        {data.map((d,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,height:"100%",justifyContent:"flex-end"}}>
            <div style={{fontSize:9,color:G.mid,fontWeight:600,textAlign:"center",lineHeight:1.2}}>{fv?fv(d.v):d.v}</div>
            <div style={{width:"100%",background:typeof color==="function"?color(d,i):color,borderRadius:"3px 3px 0 0",height:Math.max((d.v/max)*100,2)+"%"}}/>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:4,paddingTop:6,paddingLeft:6}}>
        {data.map((d,i)=><div key={i} style={{flex:1,fontSize:9,color:G.light,textAlign:"center",lineHeight:1.2,wordBreak:"break-word"}}>{d.l}</div>)}
      </div>
    </div>
  );
}
function HBar({data}){
  const max=Math.max(...data.map(d=>Math.abs(d.v)),1);
  return (
    <div>
      {data.map((d,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
          <div style={{fontSize:11,color:G.text,width:140,flexShrink:0,lineHeight:1.3}}>{d.l}</div>
          <div style={{flex:1,height:14,background:G.pale,borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",background:d.v<0?"#d62828":G.mid,width:Math.min((Math.abs(d.v)/max)*100,100)+"%"}}/>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:d.v<0?"#d62828":G.mid,width:80,textAlign:"right",flexShrink:0}}>{d.v<0?"("+fmt(Math.abs(d.v))+")":fmt(d.v)}</div>
        </div>
      ))}
    </div>
  );
}
function Donut({data}){
  const total=data.reduce((s,d)=>s+d.v,0)||1;
  const COLS=["#2d6a4f","#40916c","#52b788","#74c69d","#95d5b2","#b7e4c7","#1b4332","#081c15","#e07020","#f4a04a","#ffd166","#06d6a0","#118ab2"];
  let cum=0;
  const cx=80,cy=80,r=60,ir=36;
  const slices=data.map((d,i)=>{
    const p2=d.v/total,s=cum*2*Math.PI-Math.PI/2,e=(cum+p2)*2*Math.PI-Math.PI/2;
    cum+=p2;
    const x1=cx+r*Math.cos(s),y1=cy+r*Math.sin(s),x2=cx+r*Math.cos(e),y2=cy+r*Math.sin(e);
    const ix1=cx+ir*Math.cos(s),iy1=cy+ir*Math.sin(s),ix2=cx+ir*Math.cos(e),iy2=cy+ir*Math.sin(e);
    return {path:"M "+ix1+" "+iy1+" L "+x1+" "+y1+" A "+r+" "+r+" 0 "+(p2>0.5?1:0)+" 1 "+x2+" "+y2+" L "+ix2+" "+iy2+" A "+ir+" "+ir+" 0 "+(p2>0.5?1:0)+" 0 "+ix1+" "+iy1+" Z",color:COLS[i%COLS.length],label:d.l,pct:Math.round(p2*100)};
  });
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="1"/>)}
      </svg>
      <div style={{flex:1,minWidth:140}}>
        {slices.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
            <div style={{width:10,height:10,borderRadius:2,background:s.color,flexShrink:0}}/>
            <div style={{fontSize:11,color:G.text,flex:1,lineHeight:1.2}}>{s.label}</div>
            <div style={{fontSize:11,fontWeight:700,color:G.mid}}>{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
const SH  = ({c})=><div style={{fontSize:20,fontWeight:700,color:G.dark,marginBottom:18,paddingBottom:10,borderBottom:"2px solid "+G.border}}>{c}</div>;
const PSH = ({c})=><div style={{fontSize:18,fontWeight:800,color:G.mid,marginBottom:16,paddingBottom:8,borderBottom:"3px solid "+G.mid}}>{c}</div>;
const Sub = ({c})=><div style={{fontSize:13,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12,marginTop:4}}>{c}</div>;
const Row2= ({ch,st})=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,...(st||{})}}>{ch}</div>;
const Fld = ({l,h,ch})=><div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:G.mid,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{l}</div>{h&&<div style={{fontSize:12,color:G.light,marginBottom:5}}>{h}</div>}{ch}</div>;
const S3  = ({items})=><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:20,marginBottom:8}}>{items.map(({l,v,hi})=><div key={l} style={{background:hi?"#e8f5e0":G.card,border:"1.5px solid "+(hi?"#40916c":G.border),borderRadius:10,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:11,color:G.light,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:hi?G.mid:G.dark}}>{v}</div></div>)}</div>;
const RC  = ({t,ch})=><div className="avoid-break" style={{background:G.card,border:"1px solid "+G.border,borderRadius:12,padding:16,marginBottom:20}}><div style={{fontSize:15,fontWeight:700,color:G.dark,marginBottom:14,paddingBottom:8,borderBottom:"1px solid "+G.border}}>{t}</div>{ch}</div>;

function DemoSec({label,keys,values,setter}){
  const total=Object.values(values).reduce((s,v)=>s+v,0);
  return (
    <div style={{marginTop:20,marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <Sub c={label}/>
        <span style={{fontSize:12,fontWeight:700,color:Math.abs(total-100)<1?G.mid:G.orange}}>{total.toFixed(0)}%</span>
      </div>
      {keys.map(k=>(
        <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{fontSize:14,color:G.mid,flex:1,minWidth:0}}>{k}</div>
          <div style={{width:60,height:6,background:G.pale,borderRadius:3,flexShrink:0}}><div style={{height:"100%",background:G.mid,borderRadius:3,width:values[k]+"%"}}/></div>
          <input style={{...INP_manual,width:60,flexShrink:0,padding:8,textAlign:"center"}} type="number" step="0.5" value={values[k]} onFocus={e=>e.target.select()} onChange={e=>setter(p=>({...p,[k]:e.target.value===""?0:parseFloat(e.target.value)||0}))}/>
        </div>
      ))}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [step,setStep]=useState(0);
  const [pdfLoading,setPdfLoading]=useState(false);
  const pdfRef=useRef(null);
  const [storePhoto,setStorePhoto]=useState(null);
  const [storeNote,setStoreNote]=useState("");
  const [genesisNote,setGenesisNote]=useState("");
  const [propName,setPropName]=useState("");
  const [sqft,setSqft]=useState(800);
  const [location,setLocation]=useState("suburban");
  const [footfall,setFootfall]=useState(SECTOR.suburban.footfall);
  const [avgBasket,setAvgBasket]=useState(SECTOR.suburban.avgBasket);
  const [openHours,setOpenHours]=useState(16);
  const [uplift,setUplift]=useState(15);
  const [rent,setRent]=useState(18000);
  const [rates,setRates]=useState(6000);
  const [staffPct,setStaffPct]=useState(SECTOR.suburban.staffPct);
  const [utilities,setUtilities]=useState(SECTOR.suburban.utilities);
  const [otherCosts,setOtherCosts]=useState(SECTOR.suburban.otherCosts);
  const [refitCost,setRefitCost]=useState(75000);
  const [stockCost,setStockCost]=useState(35000);
  const [financeRate,setFinanceRate]=useState(8);
  const [financeYears,setFinanceYears]=useState(5);
  const [customRefit,setCustomRefit]=useState(false);
  const [cats,setCats]=useState(CATS0.map(c=>({...c})));
  const [ageBands,setAgeBands]=useState({"Under 18":5,"18-24":12,"25-34":20,"35-44":18,"45-54":17,"55-64":15,"65+":13});
  const [employment,setEmployment]=useState({"Employed Full-Time":38,"Employed Part-Time":14,"Self-Employed":9,"Unemployed":8,"Retired":18,"Student":13});
  const [housing,setHousing]=useState({"Owner Occupied":55,"Private Rented":25,"Social / Council":17,"Other":3});
  const [popDensity,setPopDensity]=useState("medium");
  const [catchmentPop,setCatchmentPop]=useState(8500);
  const [medianIncome,setMedianIncome]=useState(31000);
  const [deprivation,setDeprivation]=useState(5);
  const [householdSz,setHouseholdSz]=useState(2.4);
  const [spendBands,setSpendBands]=useState(SECTOR.suburban.spendBands);
  const [peakDay,setPeakDay]=useState("Friday");
  const [peakHour,setPeakHour]=useState("12-2pm");
  const [morningTrade,setMorningTrade]=useState(true);
  const [lunchTrade,setLunchTrade]=useState(false);
  const [eveningTrade,setEveningTrade]=useState(false);
  const [missions,setMissions]=useState(SECTOR.suburban.missions);
  const [traffic,setTraffic]=useState({roadVehicles:3500,pedestrians:800,cyclists:60,busStop:true,trainStation:false,school:true,office:false});
  const [fhour,setFhour]=useState(SECTOR.suburban.fhour);
  const [competitors,setCompetitors]=useState(2);
  const [nearestComp,setNearestComp]=useState(0.3);
  const [parking,setParking]=useState(4);
  const [tHP,setTHP]=useState("Rising Steadily");
  const [tPG,setTPG]=useState("Rising Steadily");
  const [tNH,setTNH]=useState("Stable");
  const [tFF,setTFF]=useState("Stable");
  const [tRG,setTRG]=useState("Stable");
  const [tVA,setTVA]=useState("Declining Slightly");
  const [areaNotes,setAreaNotes]=useState("");

  // When location changes, update all sector average fields
  useEffect(()=>{
    const s=SECTOR[location];
    if(!s) return;
    setFootfall(s.footfall);
    setAvgBasket(s.avgBasket);
    setStaffPct(s.staffPct);
    setUtilities(s.utilities);
    setOtherCosts(s.otherCosts);
    setSpendBands(s.spendBands);
    setMissions({...s.missions});
    setFhour({...s.fhour});
  },[location]);

  const totalMix=cats.reduce((s,c)=>s+c.mix,0);

  const C=useMemo(()=>{
    const wk=footfall*7*avgBasket, ann=wk*52;
    const upliftedWk = wk*(1+uplift/100);
    const upliftedAnn = upliftedWk*52;
    const blGP=cats.reduce((s,c)=>s+(c.mix/100)*c.gp,0);
    const annGP=ann*(blGP/100);
    const stf=ann*(staffPct/100);
    const annC=rent+rates+stf+utilities+otherCosts;
    const ti=refitCost+stockCost;
    const mr=financeRate/100/12, np2=financeYears*12;
    const mp=ti*(mr*Math.pow(1+mr,np2))/(Math.pow(1+mr,np2)-1);
    const af=mp*12, eb=annGP-annC, nP=annGP-annC-af;
    const roi=ti>0?(nP/ti)*100:0, pb=nP>0?ti/nP:null;
    return {wk,ann,upliftedWk,upliftedAnn,blGP,annGP,stf,annC,ti,mp,af,eb,nP,roi,pb,spf:wk/sqft,upliftedSpf:upliftedWk/sqft,pen:(footfall*365)/catchmentPop*100};
  },[footfall,avgBasket,sqft,cats,staffPct,rent,rates,utilities,otherCosts,refitCost,stockCost,financeRate,financeYears,catchmentPop]);

  const VRD=useMemo(()=>{
    if(C.roi>=20) return {l:"Strong Opportunity",   col:G.mid};
    if(C.roi>=10) return {l:"Viable - Proceed with Care", col:G.orange};
    if(C.roi>=0)  return {l:"Marginal - Review Costs",    col:"#c05010"};
    return              {l:"Not Viable",            col:"#d62828"};
  },[C.roi]);

  const DS=useMemo(()=>{
    let s=0;
    if(medianIncome>=32000)s+=2; else if(medianIncome>=25000)s+=1;
    if(catchmentPop>=10000)s+=2; else if(catchmentPop>=5000)s+=1;
    if(popDensity==="high")s+=2; else if(popDensity==="medium")s+=1;
    if(deprivation<=4)s+=1;
    const wa=ageBands["18-24"]+ageBands["25-34"]+ageBands["35-44"]+ageBands["45-54"];
    if(wa>=55)s+=2; else if(wa>=45)s+=1;
    return s;
  },[medianIncome,catchmentPop,popDensity,deprivation,ageBands]);

  const TS=useMemo(()=>{
    let s=0;
    if(traffic.roadVehicles>=5000)s+=2; else if(traffic.roadVehicles>=2000)s+=1;
    if(traffic.pedestrians>=1000)s+=2; else if(traffic.pedestrians>=400)s+=1;
    if(traffic.busStop)s+=1; if(traffic.trainStation)s+=2;
    if(traffic.school)s+=1; if(traffic.office)s+=1; if(parking>=4)s+=1;
    return s;
  },[traffic,parking]);

  const handlePhoto=e=>{const f=e.target.files[0];if(f){const r=new FileReader();r.onload=ev=>setStorePhoto(ev.target.result);r.readAsDataURL(f);}};
  const locLabel={"city-centre":"city centre / transport hub","suburban":"suburban residential area","village":"village or rural location","parade":"retail parade","forecourt":"forecourt site"}[location]||location;

  const yr5=useMemo(()=>[1,2,3,4,5].map(yr=>{
    const g=Math.pow(1.03,yr-1),cg=Math.pow(1.02,yr-1);
    const s=C.ann*g,gp=s*(C.blGP/100),stf2=s*(staffPct/100);
    const tc=(rent+rates+utilities+otherCosts)*cg+stf2;
    const eb=gp-tc,fin=yr<=financeYears?C.af:0,np=eb-fin;
    return {yr,s,gp,stf2,tc,eb,fin,np};
  }),[C,staffPct,rent,rates,utilities,otherCosts,financeYears]);

  const cumNp=yr=>yr5.slice(0,yr).reduce((a,r)=>a+r.np,0);

  const generatePDF = async () => {
    if(!pdfRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm"),
        import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"),
      ]);
      const el = pdfRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 700,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW;
      const imgH = (canvas.height * pageW) / canvas.width;
      let yOffset = 0;
      let remaining = imgH;
      while (remaining > 0) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -yOffset, imgW, imgH);
        yOffset += pageH;
        remaining -= pageH;
      }
      const filename = (propName ? propName.replace(/[^a-z0-9]/gi,"_").toLowerCase() : "assessment") + "_report.pdf";
      pdf.save(filename);
    } catch(e) {
      alert("PDF generation failed: " + e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:G.bg,minHeight:"100vh",color:G.text}}>
      <style>{`
        *{box-sizing:border-box;margin:0}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input:focus,select:focus,textarea:focus{outline:none;box-shadow:0 0 0 3px rgba(0,0,0,0.08)}
        select option{background:#fff;color:#1a3d2b}
        textarea{resize:vertical}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#b7d5c4;border-radius:3px}
        @media print{.no-print{display:none!important}body,html{background:#fff!important}main{padding:0 24px!important;max-width:100%!important}.page-break{page-break-before:always;padding-top:24px}.avoid-break{page-break-inside:avoid}}
      `}</style>

      <div className="no-print" style={{background:G.mid,padding:"16px 16px 0",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 8px #1a3d2b22"}}>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,letterSpacing:".18em",color:"#a8d5b5",textTransform:"uppercase",marginBottom:3}}>Convenience Retail</div>
          <div style={{fontSize:21,fontWeight:700,color:"#fff",lineHeight:1.2}}>Site Viability Assessor</div>
          {propName&&<div style={{fontSize:13,color:"#a8d5b5",marginTop:2}}>{propName}</div>}
        </div>
        <div style={{display:"flex",gap:2,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          {STEPS.map((s,i)=>(
            <button key={i} onClick={()=>setStep(i)} style={{flexShrink:0,padding:"8px 12px",background:step===i?"#fff":step>i?"#40916c":"transparent",border:"1px solid "+(step===i?"#fff":step>i?"#40916c":"#a8d5b5"),color:step===i?G.mid:step>i?"#fff":"#a8d5b5",fontSize:12,borderRadius:"6px 6px 0 0",whiteSpace:"nowrap",cursor:"pointer",fontFamily:"inherit",fontWeight:step===i?700:400}}>
              {i+1}. {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"24px 16px 80px",maxWidth:700,margin:"0 auto"}}>

        {/* ── COVER ── */}
        {step===0&&(
          <div>
            <SH c="Cover Page"/>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:G.mid,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Store Photo</div>
              {storePhoto?(
                <div style={{position:"relative"}}>
                  <img src={storePhoto} alt="Store" style={{width:"100%",height:240,objectFit:"cover",borderRadius:12,border:"1.5px solid "+G.border,display:"block"}}/>
                  <button onClick={()=>setStorePhoto(null)} style={{position:"absolute",top:10,right:10,background:"#fff",border:"1px solid "+G.border,borderRadius:6,padding:"5px 12px",fontSize:12,color:G.mid,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Remove</button>
                </div>
              ):(
                <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,height:180,background:G.card,border:"2px dashed "+G.border,borderRadius:12,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:40}}>📷</div>
                  <div style={{fontSize:15,fontWeight:700,color:G.mid}}>Tap to add a store photo</div>
                  <div style={{fontSize:13,color:G.light}}>JPG or PNG from your camera roll</div>
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
                </label>
              )}
            </div>
            <Fld l="About the Store" ch={<textarea value={storeNote} onChange={e=>setStoreNote(e.target.value)} placeholder="Describe the store, location, format, key features..." style={{...INP_manual,minHeight:120,lineHeight:1.7,fontSize:15}}/>}/>
            <Fld l="About Me and Genesis Retail" ch={<textarea value={genesisNote} onChange={e=>setGenesisNote(e.target.value)} placeholder="Introduce yourself and Genesis Retail..." style={{...INP_manual,minHeight:120,lineHeight:1.7,fontSize:15}}/>}/>
            {(storePhoto||storeNote||genesisNote)&&(
              <div>
                <div style={{fontSize:13,fontWeight:700,color:G.mid,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12,marginTop:8}}>Cover Preview</div>
                <div style={{background:G.card,border:"1.5px solid "+G.border,borderRadius:12,overflow:"hidden"}}>
                  <div style={{background:G.mid,padding:"16px 18px"}}>
                    <div style={{fontSize:9,letterSpacing:".2em",color:"#a8d5b5",textTransform:"uppercase",marginBottom:2}}>Site Viability Assessment</div>
                    <div style={{fontSize:16,fontWeight:800,color:"#fff"}}>{propName||"Site Name"}</div>
                    <div style={{fontSize:11,color:"#a8d5b5",marginTop:1}}>Genesis Retail - {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
                  </div>
                  {storePhoto&&<img src={storePhoto} alt="Store" style={{width:"100%",height:160,objectFit:"cover",display:"block"}}/>}
                  <div style={{padding:"14px 16px"}}>
                    {storeNote&&<div><div style={{fontSize:10,fontWeight:700,color:G.mid,textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>About the Store</div><p style={{fontSize:13,color:G.text,lineHeight:1.7,marginBottom:12,whiteSpace:"pre-wrap"}}>{storeNote}</p></div>}
                    {genesisNote&&<div><div style={{height:1,background:G.border,marginBottom:12}}/><div style={{fontSize:10,fontWeight:700,color:G.mid,textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>About Me and Genesis Retail</div><p style={{fontSize:13,color:G.text,lineHeight:1.7,whiteSpace:"pre-wrap"}}>{genesisNote}</p></div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PROPERTY ── */}
        {step===1&&(
          <div>
            <SH c="Property Details"/>
            <Legend/>
            <Fld l="Site name / address" ch={<input style={INP_manual} value={propName} onChange={e=>setPropName(e.target.value)} placeholder="e.g. 14 Station Road, Watford"/>}/>
            <Row2 ch={[
              <Fld key="a" l="Net selling area (sq ft)" h="Ask the landlord or agent" ch={<input style={INP_manual} type="number" value={sqft} onChange={e=>setSqft(+e.target.value)}/>}/>,
              <Fld key="b" l="Trading hours / day" h="Your assessment on the visit" ch={<input style={INP_manual} type="number" value={openHours} onChange={e=>setOpenHours(+e.target.value)}/>}/>,
            ]}/>
            <Fld l="Location type" h="Your assessment on the visit — auto-populates sector averages" ch={
              <select style={INP_manual} value={location} onChange={e=>setLocation(e.target.value)}>
                <option value="city-centre">City centre / transport hub</option>
                <option value="suburban">Suburban / residential estate</option>
                <option value="village">Village / rural</option>
                <option value="parade">Retail parade</option>
                <option value="forecourt">Forecourt</option>
              </select>
            }/>
            <Row2 ch={[
              <Fld key="c" l="Est. daily transactions" h="Sector average for this location — override if needed" ch={<input style={INP_auto} type="number" value={footfall} onFocus={e=>e.target.select()} onChange={e=>setFootfall(e.target.value===""?0:+e.target.value)}/>}/>,
              <Fld key="d" l="Average basket (£)" h="Sector average for this location — override if needed" ch={<input style={INP_auto} type="number" step="0.50" value={avgBasket} onFocus={e=>e.target.select()} onChange={e=>setAvgBasket(e.target.value===""?0:+e.target.value)}/>}/>,
            ]}/>
            <Fld l="Post-refit uplift (%)" h="Expected sales uplift after refit and new retailer — sector average is 10–25%. Adjust based on quality of refit and retailer capability." ch={<input style={INP_manual} type="number" step="1" min="0" max="50" value={uplift} onChange={e=>setUplift(+e.target.value)}/>}/>
            <S3 items={[{l:"Weekly turnover (base)",v:fmt(C.wk)},{l:"Post-refit weekly turnover",v:fmt(C.upliftedWk),hi:true},{l:"Sales/sqft/wk (post-refit)",v:"£"+C.upliftedSpf.toFixed(2),hi:true}]}/>
            <div style={{background:"#e8f5e0",border:"1px solid "+G.border,borderRadius:8,padding:"10px 14px",marginTop:8,fontSize:13,color:G.mid}}>
              Post-refit turnover assumes a {uplift}% uplift from new symbol group, fresh ranging and a motivated retailer. Base weekly turnover is {fmt(C.wk)}.
            </div>
          </div>
        )}

        {/* ── COSTS ── */}
        {step===2&&(
          <div>
            <SH c="Operating Costs"/>
            <Legend/>
            <Fld l="Annual rent (£)" h="Ask the landlord or agent" ch={<input style={INP_manual} type="number" value={rent} onChange={e=>setRent(+e.target.value)}/>}/>
            <Fld l="Business rates (£)" h="Check VOA website or ask the agent" ch={<input style={INP_manual} type="number" value={rates} onChange={e=>setRates(+e.target.value)}/>}/>
            <Fld l="Staff / wages (% of sales)" h={"Sector average for this location — override if needed. = "+fmt(C.stf)+" per year"} ch={<input style={INP_auto} type="number" step="0.5" value={staffPct} onFocus={e=>e.target.select()} onChange={e=>setStaffPct(e.target.value===""?0:+e.target.value)}/>}/>
            <Fld l="Utilities (£)" h="Sector average for this location — override if needed" ch={<input style={INP_auto} type="number" value={utilities} onFocus={e=>e.target.select()} onChange={e=>setUtilities(e.target.value===""?0:+e.target.value)}/>}/>
            <Fld l="Other costs (£)" h="Sector average for this location — override if needed" ch={<input style={INP_auto} type="number" value={otherCosts} onFocus={e=>e.target.select()} onChange={e=>setOtherCosts(e.target.value===""?0:+e.target.value)}/>}/>
            <S3 items={[{l:"Total annual costs",v:fmt(C.annC),hi:true},{l:"Weekly burden",v:fmt(Math.round(C.annC/52))},{l:"Cost : sales",v:pct(C.annC/C.ann*100)}]}/>
          </div>
        )}

        {/* ── REFIT ── */}
        {step===3&&(
          <div>
            <SH c="Refit and Investment"/>
            <Legend/>
            <div style={{background:"#f0faf4",border:"1px solid "+G.border,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:G.mid}}>
              Select a refit level below or enter a custom figure. Ask the landlord or fit-out contractor for quotes.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {REFITS.map(p=>(
                <button key={p.label} onClick={()=>{setRefitCost(p.value);setCustomRefit(false);}} style={{padding:"14px 12px",textAlign:"left",cursor:"pointer",background:refitCost===p.value&&!customRefit?G.pale:G.card,border:(refitCost===p.value&&!customRefit?"2px":"1px")+" solid "+(refitCost===p.value&&!customRefit?G.mid:G.border),borderRadius:10,fontFamily:"inherit"}}>
                  <div style={{fontSize:13,fontWeight:600,color:refitCost===p.value&&!customRefit?G.mid:G.light,marginBottom:4}}>{p.label}</div>
                  <div style={{fontSize:20,fontWeight:700,color:G.orange,marginBottom:3}}>{fmt(p.value)}</div>
                  <div style={{fontSize:12,color:G.light,lineHeight:1.4}}>{p.desc}</div>
                </button>
              ))}
            </div>
            <Row2 ch={[
              <Fld key="a" l="Refit cost (£)" h="Ask for quotes or use preset above" ch={<input style={INP_manual} type="number" value={refitCost} onChange={e=>{setRefitCost(+e.target.value);setCustomRefit(true);}}/>}/>,
              <Fld key="b" l="Opening stock (£)" h="Typically £25,000-£50,000" ch={<input style={INP_manual} type="number" value={stockCost} onChange={e=>setStockCost(+e.target.value)}/>}/>,
            ]}/>
            <Row2 ch={[
              <Fld key="c" l="Finance rate % APR" h="Ask your bank or finance provider" ch={<input style={INP_manual} type="number" step="0.5" value={financeRate} onChange={e=>setFinanceRate(+e.target.value)}/>}/>,
              <Fld key="d" l="Finance term (years)" h="Typically 5-7 years" ch={<input style={INP_manual} type="number" min="1" max="10" value={financeYears} onChange={e=>setFinanceYears(+e.target.value)}/>}/>,
            ]}/>
            <S3 items={[{l:"Total investment",v:fmt(C.ti),hi:true},{l:"Monthly payment",v:fmt(Math.round(C.mp))},{l:"Annual finance",v:fmt(Math.round(C.af))}]}/>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {step===4&&(
          <div>
            <SH c="Category Sales Mix"/>
            <Legend/>
            <div style={{background:"#f0faf4",border:"1px solid "+G.border,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:G.mid}}>
              Category mix and GP% are pre-populated with convenience sector averages. Override if you have specific knowledge of this site.
            </div>
            <div style={{padding:"12px 14px",borderRadius:8,marginBottom:16,background:totalMix===100?"#e8f5e0":"#fff4ea",border:"1px solid "+(totalMix===100?"#40916c":G.orange),fontSize:14,color:totalMix===100?G.mid:G.orange,fontWeight:600}}>
              {totalMix===100?"Mix totals 100%":"Currently "+totalMix.toFixed(1)+"% - adjust to reach 100%"}
            </div>
            {cats.map((cat,i)=>(
              <div key={cat.name} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{fontSize:15,fontWeight:600,color:G.text,marginBottom:10}}>{cat.icon} {cat.name}</div>
                <div style={{height:5,background:G.pale,borderRadius:3,marginBottom:12}}><div style={{height:"100%",background:G.mid,borderRadius:3,width:Math.min(cat.mix,100)+"%"}}/></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,alignItems:"end"}}>
                  <Fld l="Mix %" ch={<input style={INP_auto} type="number" step="0.5" value={cat.mix} onChange={e=>setCats(p=>p.map((c,j)=>j===i?{...c,mix:parseFloat(e.target.value)||0}:c))}/>}/>
                  <Fld l="GP %" ch={<input style={INP_auto} type="number" step="0.5" value={cat.gp} onChange={e=>setCats(p=>p.map((c,j)=>j===i?{...c,gp:parseFloat(e.target.value)||0}:c))}/>}/>
                  <div style={{textAlign:"right"}}><div style={{fontSize:11,color:G.light,marginBottom:4,textTransform:"uppercase",letterSpacing:".08em"}}>Annual</div><div style={{fontSize:17,fontWeight:700,color:G.mid}}>{fmt(C.ann*cat.mix/100)}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── DEMOGRAPHICS ── */}
        {step===5&&(
          <div>
            <SH c="Catchment Demographics"/>
            <Legend/>
            <div style={{background:"#fff4ea",border:"1px solid "+G.orange,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:G.orange,fontWeight:600}}>
              Research these figures using ONS census data (ons.gov.uk) and gov.uk deprivation data before completing this section.
            </div>
            <Row2 ch={[
              <Fld key="a" l="Catchment population (1 mile)" h="ONS data or Google Maps" ch={<input style={INP_manual} type="number" value={catchmentPop} onChange={e=>setCatchmentPop(+e.target.value)}/>}/>,
              <Fld key="b" l="Population density" h="Your assessment" ch={<select style={INP_manual} value={popDensity} onChange={e=>setPopDensity(e.target.value)}><option value="high">High - urban</option><option value="medium">Medium - suburban</option><option value="low">Low - rural</option></select>}/>,
            ]}/>
            <Row2 ch={[
              <Fld key="c" l="Median household income (£)" h="ONS data" ch={<input style={INP_manual} type="number" value={medianIncome} onChange={e=>setMedianIncome(+e.target.value)}/>}/>,
              <Fld key="d" l="Avg household size" h="ONS census data" ch={<input style={INP_manual} type="number" step="0.1" value={householdSz} onChange={e=>setHouseholdSz(+e.target.value)}/>}/>,
            ]}/>
            <Fld l="Deprivation index (1=most deprived, 10=least)" h="gov.uk indices of deprivation" ch={<input style={INP_manual} type="number" min="1" max="10" value={deprivation} onChange={e=>setDeprivation(+e.target.value)}/>}/>
            <DemoSec label="Age breakdown % — ONS census data" keys={AGE_BANDS} values={ageBands} setter={setAgeBands}/>
            <DemoSec label="Employment status % — ONS census data" keys={EMPLOYMENTS} values={employment} setter={setEmployment}/>
            <DemoSec label="Housing tenure % — ONS census data" keys={HOUSINGS} values={housing} setter={setHousing}/>
            <S3 items={[{l:"Catchment pop",v:catchmentPop.toLocaleString()},{l:"Penetration",v:pct(C.pen),hi:true},{l:"Demo score",v:DS+"/9",hi:DS>=6}]}/>
          </div>
        )}

        {/* ── SPEND ── */}
        {step===6&&(
          <div>
            <SH c="Spend Profile"/>
            <Legend/>
            <div style={{background:"#f0faf4",border:"1px solid "+G.border,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:G.mid}}>
              Spend profile, missions and footfall pattern are pre-populated with sector averages for this location type. Override if needed.
            </div>
            <Sub c="Basket size distribution (%)"/>
            {SBANDS.map(b=>(
              <div key={b.key} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:14,color:G.text}}><span>{b.label}</span><span style={{fontWeight:700,color:G.mid}}>{spendBands[b.key]}%</span></div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{flex:1,height:8,background:G.pale,borderRadius:4}}><div style={{height:"100%",background:G.mid,borderRadius:4,width:spendBands[b.key]+"%"}}/></div>
                  <input style={{...INP_auto,width:70,padding:"8px 10px",textAlign:"center"}} type="number" step="1" value={spendBands[b.key]} onChange={e=>setSpendBands(p=>({...p,[b.key]:+e.target.value}))}/>
                </div>
              </div>
            ))}
            <Row2 ch={[
              <Fld key="a" l="Peak trading day" h="Your assessment on the visit" ch={<select style={INP_manual} value={peakDay} onChange={e=>setPeakDay(e.target.value)}>{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=><option key={d}>{d}</option>)}</select>}/>,
              <Fld key="b" l="Peak trading hour" h="Your assessment on the visit" ch={<select style={INP_manual} value={peakHour} onChange={e=>setPeakHour(e.target.value)}>{FHOURS.map(h=><option key={h}>{h}</option>)}</select>}/>,
            ]}/>
            <Sub c="Trade peaks — your assessment on the visit"/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              {[["Morning commute",morningTrade,setMorningTrade],["Lunch trade",lunchTrade,setLunchTrade],["Evening / teatime",eveningTrade,setEveningTrade]].map(([l,v,s])=>(
                <button key={l} onClick={()=>s(x=>!x)} style={{padding:"10px 16px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:14,border:"1.5px solid "+(v?G.mid:G.border),background:v?G.pale:G.bg,color:v?G.mid:G.light,fontWeight:v?700:400}}>{v?"✓ ":""}{l}</button>
              ))}
            </div>
            <Sub c="Shopping mission mix % — sector average, override if needed"/>
            {MISSIONS.map(k=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{fontSize:14,color:G.text,flex:1}}>{k}</div>
                <div style={{width:80,height:8,background:G.pale,borderRadius:4}}><div style={{height:"100%",background:G.light,borderRadius:4,width:missions[k]+"%"}}/></div>
                <input style={{...INP_auto,width:64,padding:"8px 10px",textAlign:"center"}} type="number" value={missions[k]} onChange={e=>setMissions(p=>({...p,[k]:+e.target.value}))}/>
              </div>
            ))}
          </div>
        )}

        {/* ── TRAFFIC ── */}
        {step===7&&(
          <div>
            <SH c="Traffic and Area"/>
            <Legend/>
            <div style={{background:"#fff4ea",border:"1px solid "+G.orange,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:G.orange,fontWeight:600}}>
              All traffic and area fields are assessed by you on the visit or from local knowledge.
            </div>
            {TRAFFIC_F.map(f=>(
              <div key={f.k} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:14,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                <div style={{flex:1}}><div style={{fontSize:15,color:G.text,fontWeight:500}}>{f.l}</div>{f.h&&<div style={{fontSize:12,color:G.light,marginTop:2}}>{f.h}</div>}</div>
                {f.num?(
                  <input style={{...INP_manual,width:110,flexShrink:0,textAlign:"right"}} type="number" value={traffic[f.k]} onChange={e=>setTraffic(p=>({...p,[f.k]:+e.target.value}))}/>
                ):(
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button onClick={()=>setTraffic(p=>({...p,[f.k]:true}))} style={{padding:"8px 16px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:14,border:"1.5px solid "+(traffic[f.k]?G.mid:G.border),background:traffic[f.k]?G.pale:G.bg,color:traffic[f.k]?G.mid:G.light,fontWeight:traffic[f.k]?700:400}}>Yes</button>
                    <button onClick={()=>setTraffic(p=>({...p,[f.k]:false}))} style={{padding:"8px 16px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:14,border:"1.5px solid "+(!traffic[f.k]?G.mid:G.border),background:!traffic[f.k]?G.pale:G.bg,color:!traffic[f.k]?G.mid:G.light,fontWeight:!traffic[f.k]?700:400}}>No</button>
                  </div>
                )}
              </div>
            ))}
            <Row2 ch={[
              <Fld key="a" l="Parking spaces" h="Count on the visit" ch={<input style={INP_manual} type="number" value={parking} onChange={e=>setParking(+e.target.value)}/>}/>,
              <Fld key="b" l="Competitors within 0.5 mile" h="Count on the visit" ch={<input style={INP_manual} type="number" value={competitors} onChange={e=>setCompetitors(+e.target.value)}/>}/>,
            ]} st={{marginTop:8}}/>
            <Fld l="Nearest competitor (miles)" h="Assess on the visit" ch={<input style={INP_manual} type="number" step="0.1" value={nearestComp} onChange={e=>setNearestComp(+e.target.value)}/>}/>
            <Sub c="Footfall by hour — sector average, override if needed"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:24}}>
              {FHOURS.map(h=>(
                <div key={h} style={{background:G.card,border:"1px solid "+G.border,borderRadius:8,padding:"10px 8px"}}>
                  <div style={{fontSize:11,color:G.light,marginBottom:6,textAlign:"center"}}>{h}</div>
                  <input style={{...INP_auto,textAlign:"center",padding:"8px 6px"}} type="number" step="1" value={fhour[h]} onFocus={e=>e.target.select()} onChange={e=>setFhour(p=>({...p,[h]:e.target.value===""?0:+e.target.value}))}/>
                </div>
              ))}
            </div>
            <Sub c="Area trends — your assessment from the visit and local knowledge"/>
            {[["House prices",tHP,setTHP],["Population growth",tPG,setTPG],["New housing",tNH,setTNH],["Footfall trend",tFF,setTFF],["Area regeneration",tRG,setTRG],["Retail vacancy",tVA,setTVA]].map(([l,v,s])=>(
              <div key={l} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
                <div style={{fontSize:14,color:G.text,fontWeight:500,marginBottom:8}}>{l}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {TRENDS.map(t=>(
                    <button key={t} onClick={()=>s(t)} style={{padding:"7px 12px",borderRadius:6,cursor:"pointer",fontFamily:"inherit",fontSize:12,border:"1.5px solid "+(v===t?TCOLORS[t]:G.border),background:v===t?TCOLORS[t]+"18":G.bg,color:v===t?TCOLORS[t]:G.light,fontWeight:v===t?700:400}}>{t}</button>
                  ))}
                </div>
              </div>
            ))}
            <Fld l="Area notes" h="Planning apps, new competitors, regeneration, anything relevant" ch={<textarea style={{...INP_manual,minHeight:80,lineHeight:1.5}} value={areaNotes} onChange={e=>setAreaNotes(e.target.value)} placeholder="e.g. 200-unit housing development 0.3 miles north due Q3 2026..."/>}/>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step===8&&(
          <div>
            <div style={{marginBottom:20}}>
              <button onClick={generatePDF} disabled={pdfLoading} style={{width:"100%",padding:15,background:pdfLoading?"#7aad94":G.mid,border:"none",borderRadius:10,color:"#fff",cursor:pdfLoading?"not-allowed":"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700}}>
                {pdfLoading?"⏳ Generating PDF…":"⬇ Download Report as PDF"}
              </button>
              <p style={{fontSize:12,color:G.light,marginTop:8,textAlign:"center"}}>Downloads a full A4 PDF directly to your device.</p>
            </div>

            {/* COVER PAGE */}
            <div ref={pdfRef}>
            <div style={{minHeight:"90vh",display:"flex",flexDirection:"column",borderBottom:"3px solid "+G.mid,marginBottom:28,paddingBottom:32}}>
              <div style={{background:G.mid,borderRadius:10,padding:"18px 20px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                <div>
                  <div style={{fontSize:10,letterSpacing:".22em",color:"#a8d5b5",textTransform:"uppercase",marginBottom:3}}>Site Viability Assessment Report</div>
                  <div style={{fontSize:22,fontWeight:800,color:"#fff",lineHeight:1.2}}>{propName||"Site Assessment"}</div>
                  <div style={{fontSize:12,color:"#a8d5b5",marginTop:3}}>Prepared by Genesis Retail - {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
                </div>
                <div style={{background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"10px 16px",textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:10,color:"#a8d5b5",textTransform:"uppercase",letterSpacing:".12em",marginBottom:2}}>Overall Verdict</div>
                  <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{VRD.l}</div>
                  <div style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1.1,marginTop:2}}>{C.roi.toFixed(1)}% ROI</div>
                </div>
              </div>
              {storePhoto?(
                <div style={{marginBottom:20}}><img src={storePhoto} alt="Store" style={{width:"100%",height:260,objectFit:"cover",borderRadius:12,border:"1.5px solid "+G.border,display:"block"}}/></div>
              ):(
                <label className="no-print" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,height:180,background:G.card,border:"2px dashed "+G.border,borderRadius:12,cursor:"pointer",textAlign:"center",marginBottom:20}}>
                  <div style={{fontSize:36}}>📷</div>
                  <div style={{fontSize:14,fontWeight:700,color:G.mid}}>Tap to add a store photo</div>
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
                </label>
              )}
              {storeNote&&<div style={{marginBottom:16}}><div style={{fontSize:12,fontWeight:700,color:G.mid,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>About the Store</div><p style={{fontSize:14,color:G.text,lineHeight:1.8,whiteSpace:"pre-wrap",background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:"14px 16px"}}>{storeNote}</p></div>}
              {genesisNote&&<div style={{marginTop:"auto",paddingTop:16,borderTop:"1px solid "+G.border}}><div style={{fontSize:12,fontWeight:700,color:G.mid,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>About Me and Genesis Retail</div><p style={{fontSize:14,color:G.text,lineHeight:1.8,whiteSpace:"pre-wrap",background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:"14px 16px"}}>{genesisNote}</p></div>}
            </div>

            {/* S1: FINANCIAL */}
            <div className="page-break avoid-break">
              <PSH c="1. Financial Summary"/>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:24}}>
                {[["Base Weekly Turnover",fmt(C.wk)],["Post-Refit Weekly Turnover",fmt(C.upliftedWk)],["Annual Sales (post-refit)",fmt(C.upliftedAnn)],["Gross Profit "+pct(C.blGP),fmt(C.annGP)],["Net Profit",fmt(C.nP)],["ROI",pct(C.roi)],["Total Investment",fmt(C.ti)],["Payback",C.pb?C.pb.toFixed(1)+" yrs":"N/A"],["Sales/sqft/wk",fmt(C.upliftedSpf)]].map(([l,v])=>(
                  <div key={l} style={{background:G.card,border:"1px solid "+G.border,borderRadius:8,padding:12,textAlign:"center"}}>
                    <div style={{fontSize:11,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:5}}>{l}</div>
                    <div style={{fontSize:17,fontWeight:700,color:G.mid}}>{v}</div>
                  </div>
                ))}
              </div>
              <RC t="Profit and Loss" ch={<HBar data={[{l:"Gross Profit",v:C.annGP},{l:"Rent",v:-rent},{l:"Rates",v:-rates},{l:"Staff "+staffPct+"%",v:-C.stf},{l:"Utilities",v:-utilities},{l:"Other",v:-otherCosts},{l:"EBITDA",v:C.eb},{l:"Finance",v:-C.af},{l:"Net Profit",v:C.nP}]}/>}/>
            </div>

            {/* S2: CATEGORIES */}
            <div className="page-break avoid-break">
              <PSH c="2. Category Sales Mix"/>
              <RC t="Annual Sales by Category" ch={<BarChart data={[...cats].sort((a,b)=>b.mix-a.mix).map(c=>({l:c.name.split(" ")[0],v:Math.round(C.ann*c.mix/100)}))} height={200} fv={v=>fmt(v).replace(",000","k")}/>}/>
              <RC t="Category Mix" ch={<Donut data={cats.filter(c=>c.mix>0).map(c=>({l:c.name,v:c.mix}))}/>}/>
              <RC t="Gross Profit % by Category" ch={<BarChart data={[...cats].sort((a,b)=>b.gp-a.gp).map(c=>({l:c.name.split(" ")[0],v:c.gp}))} height={160} fv={v=>v+"%"}/>}/>
            </div>

            {/* S3: FOOTFALL */}
            <div className="page-break avoid-break">
              <PSH c="3. Footfall and Spend Profile"/>
              <RC t="Footfall by Hour of Day" ch={<BarChart data={FHOURS.map(h=>({l:h,v:fhour[h]}))} height={160} fv={v=>v+"%"}/>}/>
              <RC t="Basket Size Distribution" ch={<BarChart data={SBANDS.map(b=>({l:b.label,v:spendBands[b.key]}))} height={150} fv={v=>v+"%"}/>}/>
              <RC t="Shopping Mission Mix" ch={<Donut data={MISSIONS.map(k=>({l:k,v:missions[k]}))}/>}/>
            </div>

            {/* S4: DEMOGRAPHICS */}
            <div className="page-break avoid-break">
              <PSH c="4. Catchment Demographics"/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[["Catchment Population",catchmentPop.toLocaleString()],["Median Income",fmt(medianIncome)],["Penetration Rate",pct(C.pen)],["Deprivation Index",deprivation+"/10"],["Demographic Score",DS+"/9"],["Avg Household Size",""+householdSz]].map(([l,v])=>(
                  <div key={l} style={{background:G.card,border:"1px solid "+G.border,borderRadius:8,padding:"10px 12px"}}>
                    <div style={{fontSize:11,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:G.mid}}>{v}</div>
                  </div>
                ))}
              </div>
              <RC t="Age Profile" ch={<BarChart data={AGE_BANDS.map(k=>({l:k,v:ageBands[k]}))} height={140} fv={v=>v+"%"}/>}/>
              <RC t="Employment Status" ch={<BarChart data={EMPLOYMENTS.map(k=>({l:k.split(" ")[0],v:employment[k]}))} height={130} fv={v=>v+"%"}/>}/>
              <RC t="Housing Tenure" ch={<Donut data={HOUSINGS.map(k=>({l:k,v:housing[k]}))}/>}/>
            </div>

            {/* S5: DETAILED P&L */}
            <div className="page-break avoid-break">
              <PSH c="5. Detailed Profit and Loss"/>
              <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:12,overflow:"hidden",marginBottom:20}}>
                {[
                  {type:"head",l:"INCOME"},
                  {type:"row", l:"Gross Sales Revenue",v:C.ann,bold:true},
                  {type:"row", l:"Cost of Goods "+pct(100-C.blGP),v:-(C.ann*(1-C.blGP/100))},
                  {type:"sub", l:"GROSS PROFIT",v:C.annGP,bold:true},
                  {type:"gap"},
                  {type:"head",l:"OPERATING COSTS"},
                  {type:"row", l:"Rent",v:-rent},
                  {type:"row", l:"Business Rates",v:-rates},
                  {type:"row", l:"Staff and Wages "+staffPct+"% of sales",v:-C.stf},
                  {type:"row", l:"Utilities",v:-utilities},
                  {type:"row", l:"Other Costs",v:-otherCosts},
                  {type:"sub", l:"TOTAL OPERATING COSTS",v:-(rent+rates+C.stf+utilities+otherCosts),bold:true},
                  {type:"gap"},
                  {type:"sub", l:"EBITDA",v:C.eb,bold:true,hi:true},
                  {type:"gap"},
                  {type:"head",l:"FINANCE"},
                  {type:"row", l:"Loan Repayment "+financeRate+"% APR / "+financeYears+"yr",v:-C.af},
                  {type:"gap"},
                  {type:"sub", l:"NET PROFIT",v:C.nP,bold:true,hi:true},
                  {type:"gap"},
                  {type:"head",l:"KEY RATIOS"},
                  {type:"kv",  l:"Gross Margin",d:pct(C.blGP)},
                  {type:"kv",  l:"Staff Cost Ratio",d:staffPct+"%"},
                  {type:"kv",  l:"Total Cost Ratio",d:pct(C.annC/C.ann*100)},
                  {type:"kv",  l:"EBITDA Margin",d:pct(C.eb/C.ann*100)},
                  {type:"kv",  l:"Net Margin",d:pct(C.nP/C.ann*100)},
                  {type:"kv",  l:"Return on Investment",d:pct(C.roi)},
                  {type:"kv",  l:"Payback Period",d:C.pb?C.pb.toFixed(1)+" years":"N/A"},
                  {type:"kv",  l:"Sales per Sq Ft weekly",d:"£"+C.spf.toFixed(2)},
                ].map((r,i)=>{
                  if(r.type==="gap") return <div key={i} style={{height:8}}/>;
                  if(r.type==="head") return <div key={i} style={{background:G.mid,padding:"6px 16px",fontSize:11,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:".12em"}}>{r.l}</div>;
                  if(r.type==="kv")  return <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 16px",borderBottom:"1px solid "+G.border}}><span style={{fontSize:13,color:G.light}}>{r.l}</span><span style={{fontSize:13,fontWeight:700,color:G.mid}}>{r.d}</span></div>;
                  const neg=r.v<0,hiCol=r.v>=0?G.mid:"#d62828";
                  return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:(r.type==="sub"?"10px":"7px")+" 16px",borderBottom:"1px solid "+G.border,background:r.hi?(r.v>=0?"#e8f5e0":"#fde8e8"):r.type==="sub"?G.pale:"transparent"}}>
                    <span style={{fontSize:r.bold?14:13,color:r.bold?G.dark:G.text,fontWeight:r.bold?700:400,paddingLeft:r.type==="row"?12:0}}>{r.l}</span>
                    <span style={{fontSize:r.bold?15:13,fontWeight:r.bold?700:400,color:r.hi?hiCol:neg?"#c05010":G.dark}}>{neg?"("+fmt(Math.abs(r.v))+")":fmt(r.v)}</span>
                  </div>;
                })}
              </div>
            </div>

            {/* S6: 5-YEAR */}
            <div className="page-break avoid-break">
              <PSH c="6. Five-Year Cash Flow Forecast"/>
              <div style={{background:"#e8f5e0",border:"1px solid "+G.border,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:G.mid}}>
                Assumes 3% annual sales growth and 2% cost inflation. Finance cost shown until end of loan term.
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:G.mid}}>
                      <th style={{padding:"10px",textAlign:"left",color:"#fff",fontWeight:700,minWidth:160}}>Item</th>
                      {[1,2,3,4,5].map(y=><th key={y} style={{padding:"10px 8px",textAlign:"right",color:"#fff",fontWeight:700,minWidth:90}}>Year {y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {l:"Sales Revenue",k:"s",neg:false},
                      {l:"Gross Profit",k:"gp",neg:false,sub:true},
                      {l:"  Op. Costs",k:"tc",neg:true},
                      {l:"EBITDA",k:"eb",neg:false,hi:true},
                      {l:"Finance Cost",k:"fin",neg:true},
                      {l:"Net Profit",k:"np",neg:false,hi:true},
                    ].map((dr,i)=>(
                      <tr key={i} style={{background:dr.hi?"#e8f5e0":dr.sub?G.pale:i%2===0?G.card:"#fff",borderBottom:"1px solid "+G.border}}>
                        <td style={{padding:"8px 10px",fontSize:13,fontWeight:dr.hi?700:400,color:dr.hi?G.mid:G.text}}>{dr.l}</td>
                        {yr5.map((r,j)=>{const val=dr.neg?-r[dr.k]:r[dr.k];const neg=val<0;return <td key={j} style={{padding:"8px",textAlign:"right",fontWeight:dr.hi?700:400,color:neg?"#d62828":dr.hi?G.mid:G.dark,fontSize:13}}>{neg?"("+fmt(Math.abs(val))+")":fmt(val)}</td>;})}
                      </tr>
                    ))}
                    <tr style={{background:G.pale,borderBottom:"1px solid "+G.border}}>
                      <td style={{padding:"8px 10px",fontSize:13,fontWeight:700,color:G.mid}}>Cumulative Net Profit</td>
                      {[1,2,3,4,5].map(y=>{const cn=cumNp(y);return <td key={y} style={{padding:"8px",textAlign:"right",fontWeight:700,color:cn<0?"#d62828":G.mid,fontSize:13}}>{cn<0?"("+fmt(Math.abs(cn))+")":fmt(cn)}</td>;})}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:20}}>
                <div style={{fontSize:13,fontWeight:700,color:G.mid,marginBottom:10}}>Cumulative Net Profit - 5 Years</div>
                <BarChart data={[1,2,3,4,5].map(y=>({l:"Yr "+y,v:Math.max(0,cumNp(y))}))} height={140} fv={v=>fmt(v).replace(",000","k")}/>
              </div>
            </div>

            {/* S7: AREA */}
            <div className="page-break avoid-break">
              <PSH c="7. Area Trends and Traffic"/>
              <RC t="Area Trend Summary" ch={
                <div>{[["House prices",tHP],["Population growth",tPG],["New housing",tNH],["Footfall trend",tFF],["Area regeneration",tRG],["Retail vacancy",tVA]].map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid "+G.border}}>
                    <span style={{fontSize:14,color:G.text,fontWeight:500}}>{l}</span>
                    <span style={{padding:"4px 12px",borderRadius:6,fontSize:12,fontWeight:700,background:TCOLORS[v]+"18",color:TCOLORS[v],border:"1px solid "+TCOLORS[v]+"44"}}>{v}</span>
                  </div>
                ))}</div>
              }/>
              <RC t="Traffic and Access" ch={
                <div>
                  {TRAFFIC_F.map(f=>(
                    <div key={f.k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+G.border,fontSize:14}}>
                      <span style={{color:G.text}}>{f.l}</span>
                      <span style={{fontWeight:700,color:G.mid}}>{f.num?traffic[f.k].toLocaleString():(traffic[f.k]?"Yes":"No")}</span>
                    </div>
                  ))}
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:14,borderBottom:"1px solid "+G.border}}><span style={{color:G.text}}>Parking spaces</span><span style={{fontWeight:700,color:G.mid}}>{parking}</span></div>
                  <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",fontSize:14}}><span style={{color:G.text}}>Nearest competitor</span><span style={{fontWeight:700,color:G.mid}}>{nearestComp} miles</span></div>
                </div>
              }/>
              {areaNotes&&<RC t="Area Intelligence Notes" ch={<p style={{fontSize:14,color:G.text,lineHeight:1.7,fontStyle:"italic"}}>{areaNotes}</p>}/>}
            </div>

            {/* S8: WRITTEN REPORT */}
            <div className="page-break avoid-break">
              <PSH c="8. Written Assessment Report"/>
              <div style={{background:"#fff",border:"1px solid "+G.border,borderRadius:12,padding:"24px 20px"}}>
                {[
                  {h:"Executive Summary",body:[
                    "This report presents a viability assessment for the convenience retail site"+(propName?" at "+propName:"")+". Based on the financial modelling and market analysis contained within this document, the overall verdict is "+VRD.l+". The projected return on investment stands at "+pct(C.roi)+", with an estimated payback period of "+(C.pb?C.pb.toFixed(1)+" years":"more than the forecast period")+".",
                    "The site is located in a "+locLabel+", with an estimated net selling area of "+sqft.toLocaleString()+" square feet and proposed trading hours of "+openHours+" hours per day. At the projected daily transaction count of "+footfall.toLocaleString()+" customers and an average basket value of £"+avgBasket.toFixed(2)+", the business is forecast to generate weekly sales of "+fmt(C.wk)+" and annual sales of "+fmt(C.ann)+".",
                  ]},
                  {h:"Trading Performance",body:[
                    "The site is projected to achieve base weekly sales of "+fmt(C.wk)+" prior to any investment or refit. Following the installation of a new retailer and a "+uplift+"% post-refit uplift — reflecting the benefit of a fresh symbol group, improved ranging and a motivated operator — projected weekly turnover rises to "+fmt(C.upliftedWk)+", equating to annual sales of "+fmt(C.upliftedAnn)+".",
                    "This gives a post-refit sales density of £"+C.upliftedSpf.toFixed(2)+" per square foot per week, which is "+(C.upliftedSpf>=12?"above":"below")+" the industry benchmark of £12.00 per square foot per week for a well-performing independent convenience store.",
                    "The blended gross profit margin across all categories is forecast at "+pct(C.blGP)+", generating annual gross profit of "+fmt(C.annGP)+". The category mix is led by "+[...cats].sort((a,b)=>b.mix-a.mix).slice(0,3).map(c=>c.name).join(", ")+", which together account for "+[...cats].sort((a,b)=>b.mix-a.mix).slice(0,3).reduce((s,c)=>s+c.mix,0).toFixed(0)+"% of projected sales.",
                  ]},
                  {h:"Financial Viability",body:[
                    "Total annual operating costs are forecast at "+fmt(C.annC)+", representing "+pct(C.annC/C.ann*100)+" of turnover. Staff and wages are budgeted at "+staffPct+"% of sales ("+fmt(C.stf)+" per annum), followed by rent at "+fmt(rent)+" per year and business rates of "+fmt(rates)+" per year.",
                    "After all operating costs, the business is forecast to generate EBITDA of "+fmt(C.eb)+", representing an EBITDA margin of "+pct(C.eb/C.ann*100)+". Following finance costs of "+fmt(C.af)+" per annum, based on a "+financeRate+"% APR loan over "+financeYears+" years, the net profit position is "+fmt(C.nP)+" in year one.",
                    "The total capital investment required is "+fmt(C.ti)+", comprising a refit cost of "+fmt(refitCost)+" and opening stock of "+fmt(stockCost)+". Monthly loan repayments are projected at "+fmt(Math.round(C.mp))+". The return on investment is "+pct(C.roi)+" and the investment is forecast to be recovered within "+(C.pb?C.pb.toFixed(1)+" years":"the extended forecast period")+".",
                  ]},
                  {h:"Catchment and Demographics",body:[
                    "The catchment area within a one-mile radius has an estimated population of "+catchmentPop.toLocaleString()+" residents, with a "+popDensity+" population density. The median household income is "+fmt(medianIncome)+" per annum and the average household size is "+householdSz+" persons. The area scores "+deprivation+" out of 10 on the deprivation index.",
                    "At the projected transaction level, the store would achieve a catchment penetration rate of "+pct(C.pen)+". The demographic profile shows a working-age population of "+(ageBands["18-24"]+ageBands["25-34"]+ageBands["35-44"]+ageBands["45-54"])+"%, which is a positive indicator for convenience retail demand. The overall demographic score for this catchment is "+DS+" out of 9.",
                  ]},
                  {h:"Site and Traffic Assessment",body:[
                    "The site benefits from an estimated "+traffic.roadVehicles.toLocaleString()+" road vehicles and "+traffic.pedestrians.toLocaleString()+" pedestrians passing per day."+(traffic.busStop?" A bus stop is located within 50 metres.":"")+(traffic.trainStation?" A train station is within five minutes.":"")+(traffic.school?" A school or college is within 400 metres.":"")+(traffic.office?" Nearby office or industrial employment provides additional trade opportunity.":""),
                    "The site has "+parking+" dedicated parking spaces"+(parking>=4?", which is sufficient to support a convenience retail operation":", which may limit basket size and should be reviewed")+". There are "+competitors+" competitor stores within half a mile, with the nearest located "+nearestComp+" miles away. The traffic and access score is "+TS+" out of 11.",
                  ]},
                  {h:"Area Outlook",body:[
                    "The area outlook is assessed across six key indicators. House prices are "+tHP.toLowerCase()+", population growth is "+tPG.toLowerCase()+", new housing development is "+tNH.toLowerCase()+", historical footfall trend is "+tFF.toLowerCase()+", area regeneration is "+tRG.toLowerCase()+", and retail vacancy rates are "+tVA.toLowerCase()+".",
                    ...(areaNotes?["Additional intelligence: "+areaNotes]:[]),
                  ]},
                  {h:"Conclusion and Recommendation",body:[
                    "On the basis of this assessment, the site"+(propName?" at "+propName:"")+" is rated as: "+VRD.l+".",
                    C.roi>=20?"The financial model demonstrates a strong return on investment of "+pct(C.roi)+", well above the 20% threshold typically required for a convenience retail investment. Subject to satisfactory lease terms and operator capability, this site represents a compelling opportunity."
                    :C.roi>=10?"The financial model shows a return on investment of "+pct(C.roi)+", which is viable but below the 20% threshold considered ideal. The operator should seek to improve margin through category mix optimisation and negotiate the most favourable lease terms possible before committing."
                    :C.roi>=0?"The financial model produces a marginal return on investment of "+pct(C.roi)+". The margin of safety is insufficient to recommend investment without significant improvements to the cost base or revenue assumptions. A thorough review of rent, staffing ratios and category margins is advised."
                    :"The financial model produces a negative return on investment of "+pct(C.roi)+". On current assumptions the business is not viable. A fundamental review of the site economics, particularly rent, projected footfall and basket value, would be required before this site could be reconsidered.",
                  ]},
                ].map((section,si)=>(
                  <div key={si}>
                    <div style={{fontSize:15,fontWeight:700,color:G.mid,marginTop:si===0?0:24,marginBottom:10,paddingBottom:6,borderBottom:"1px solid "+G.border}}>{section.h}</div>
                    {section.body.map((para,pi)=><p key={pi} style={{fontSize:14,color:G.text,lineHeight:1.9,marginBottom:12}}>{para}</p>)}
                  </div>
                ))}
                <div style={{marginTop:24,paddingTop:16,borderTop:"1px solid "+G.border,fontSize:12,color:G.light,fontStyle:"italic"}}>
                  This report has been prepared by Genesis Retail. All financial projections are based on the assumptions stated within this document and are provided for indicative purposes only. Actual trading performance may differ materially from projections. This report does not constitute financial or legal advice.
                </div>
              </div>
            </div>

            </div>{/* end pdfRef */}

            <div style={{display:"flex",gap:12,marginTop:28}}>
              <button onClick={()=>setStep(7)} style={{flex:1,padding:14,background:G.bg,border:"1.5px solid "+G.border,borderRadius:10,color:G.mid,cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:600}}>Back</button>
              <button onClick={()=>setStep(0)} style={{flex:1,padding:14,background:G.pale,border:"1.5px solid "+G.mid,borderRadius:10,color:G.mid,cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:700}}>New Assessment</button>
            </div>
          </div>
        )}

        {step<8&&(
          <div style={{display:"flex",gap:12,marginTop:28}}>
            {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:14,background:G.bg,border:"1.5px solid "+G.border,borderRadius:10,color:G.mid,cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:600}}>Back</button>}
            <button onClick={()=>setStep(s=>s+1)} style={{flex:2,padding:14,background:G.mid,border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700}}>Continue</button>
          </div>
        )}
      </div>
    </div>
  );
}
