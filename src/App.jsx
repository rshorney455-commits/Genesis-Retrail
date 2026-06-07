/**
 * ============================================================================
 * GENESIS RETAIL — SITE VIABILITY ASSESSMENT TOOL
 * ============================================================================
 * Copyright © 2026 Richard Shorney, Genesis Retail.
 * All rights reserved.
 *
 * This software and its source code are the exclusive intellectual property
 * of Richard Shorney, trading as Genesis Retail (genesisretail.uk).
 *
 * The financial methodology, calculation logic, sector benchmarks, commentary
 * system, report structure and all other components of this tool are
 * proprietary and confidential.
 *
 * STRICTLY PROHIBITED without prior written consent:
 *   - Copying, reproducing or distributing this code
 *   - Reverse engineering the methodology or calculations
 *   - Using this tool or its outputs to develop a competing product
 *   - Removing or altering this copyright notice
 *
 * Unauthorised use constitutes infringement of copyright and may result in
 * civil and/or criminal liability under the Copyright, Designs and Patents
 * Act 1988 and applicable law.
 *
 * Contact: rshorney@genesisretail.uk | www.genesisretail.uk
 * ============================================================================
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";

// ── Sector averages by location type ─────────────────────────────────────────
const SECTOR = {
  "city-centre": {
    footfall:600, avgBasket:5.50, staffPct:10, utilities:12000, otherCosts:9000,
    spendBands:{u5:35,s5:38,s10:15,s15:8,s20:4},
    missions:{"Top-up":30,"Grab and Go":35,"Treat or Impulse":15,"Food to Go":15,"Big Shop Supplement":5},
    fhour:{"6-8am":8,"8-10am":18,"10-12pm":10,"12-2pm":22,"2-4pm":10,"4-6pm":18,"6-8pm":10,"8-10pm":4},
  },
  "suburban": {
    footfall:400, avgBasket:6.80, staffPct:9, utilities:9000, otherCosts:8000,
    spendBands:{u5:25,s5:38,s10:22,s15:10,s20:5},
    missions:{"Top-up":42,"Grab and Go":22,"Treat or Impulse":15,"Food to Go":8,"Big Shop Supplement":13},
    fhour:{"6-8am":4,"8-10am":14,"10-12pm":12,"12-2pm":16,"2-4pm":12,"4-6pm":18,"6-8pm":16,"8-10pm":8},
  },
  "village": {
    footfall:250, avgBasket:8.00, staffPct:9, utilities:7500, otherCosts:7000,
    spendBands:{u5:15,s5:30,s10:28,s15:17,s20:10},
    missions:{"Top-up":45,"Grab and Go":18,"Treat or Impulse":12,"Food to Go":5,"Big Shop Supplement":20},
    fhour:{"6-8am":3,"8-10am":12,"10-12pm":15,"12-2pm":14,"2-4pm":13,"4-6pm":16,"6-8pm":18,"8-10pm":9},
  },
  "parade": {
    footfall:350, avgBasket:7.00, staffPct:9, utilities:8500, otherCosts:7500,
    spendBands:{u5:20,s5:36,s10:24,s15:13,s20:7},
    missions:{"Top-up":40,"Grab and Go":25,"Treat or Impulse":15,"Food to Go":8,"Big Shop Supplement":12},
    fhour:{"6-8am":4,"8-10am":13,"10-12pm":14,"12-2pm":17,"2-4pm":12,"4-6pm":18,"6-8pm":16,"8-10pm":6},
  },
  "forecourt": {
    footfall:500, avgBasket:6.00, staffPct:11, utilities:14000, otherCosts:10000,
    spendBands:{u5:40,s5:36,s10:14,s15:7,s20:3},
    missions:{"Top-up":25,"Grab and Go":40,"Treat or Impulse":18,"Food to Go":14,"Big Shop Supplement":3},
    fhour:{"6-8am":10,"8-10am":16,"10-12pm":12,"12-2pm":14,"2-4pm":12,"4-6pm":16,"6-8pm":14,"8-10pm":6},
  },
};

const SYMBOL_GROUPS = [
  { name:"Spar",         tier:"mid",      minSpend:8000,  margin:22, bestFor:["suburban","village","parade"],      desc:"Strong fresh food, good margin, wide UK coverage" },
  { name:"Nisa",         tier:"mid",      minSpend:8000,  margin:23, bestFor:["suburban","village","parade"],      desc:"Co-op own brand access, flexible terms" },
  { name:"Costcutter",   tier:"value",    minSpend:6000,  margin:20, bestFor:["suburban","parade","forecourt"],    desc:"Value positioning, strong chilled range" },
  { name:"Premier",      tier:"value",    minSpend:5000,  margin:19, bestFor:["village","suburban","parade"],      desc:"Lowest entry threshold, good for smaller stores" },
  { name:"Londis",       tier:"value",    minSpend:6000,  margin:20, bestFor:["city-centre","suburban","parade"],  desc:"Strong urban presence, competitive pricing" },
  { name:"Best-one",     tier:"value",    minSpend:5000,  margin:18, bestFor:["suburban","parade"],                desc:"Flexible, good for independent operators" },
  { name:"Bargain Booze",tier:"specialist",minSpend:7000, margin:21, bestFor:["suburban","parade","forecourt"],    desc:"Alcohol specialist, strong BWS margin" },
  { name:"Budgens",      tier:"premium",  minSpend:12000, margin:25, bestFor:["village","suburban"],               desc:"Premium positioning, strong fresh, higher basket" },
];

// ACS Local Shop Report 2025 — actual UK convenience sector category mix
// Source: ACS/Lumina Intelligence/Shopmate 2025 (IGD September 2024 overall convenience market)
const CATS0 = [
  {name:"Tobacco & Vaping",      mix:18.8, gp:8,  icon:"🚬", acs:true},
  {name:"Alcohol",               mix:15.2, gp:22, icon:"🍺", acs:true},
  {name:"Chilled Foods",         mix:12.9, gp:27, icon:"🥛", acs:true},
  {name:"Soft Drinks",           mix:7.9,  gp:28, icon:"🥤", acs:true},
  {name:"Canned & Packaged Grocery", mix:7.6, gp:25, icon:"🛒", acs:true},
  {name:"Confectionery",         mix:6.4,  gp:32, icon:"🍫", acs:true},
  {name:"Bread & Bakery",        mix:5.7,  gp:30, icon:"🍞", acs:true},
  {name:"Fruit & Veg",           mix:3.8,  gp:35, icon:"🥦", acs:true},
  {name:"Bagged Savoury Snacks", mix:3.9,  gp:30, icon:"🍟", acs:true},
  {name:"Fresh Milk",            mix:3.2,  gp:18, icon:"🥛", acs:true},
  {name:"Frozen Foods",          mix:2.7,  gp:29, icon:"🧊", acs:true},
  {name:"Health & Beauty",       mix:2.6,  gp:38, icon:"💊", acs:true},
  {name:"Household",             mix:2.7,  gp:28, icon:"🏠", acs:true},
  {name:"News & Magazines",      mix:2.2,  gp:24, icon:"📰", acs:true},
  {name:"Hot Food & Drinks To Go",mix:1.0, gp:55, icon:"☕", acs:true},
  {name:"Non-Food / Other",      mix:3.4,  gp:33, icon:"⭐", acs:true},
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
const TCOLORS     = {"Rising Rapidly":"#1e3a8a","Rising Steadily":"#2d55c8","Stable":"#6b83c9","Declining Slightly":"#c05010","Declining Rapidly":"#d62828"};
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
const STEPS = ["Cover","Property","Costs","Refit","Categories","Demographics","Spend","Traffic","Spreadsheet","Results","Admin"];

const fmt = n => new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP",maximumFractionDigits:0}).format(n);
const pct = n => n.toFixed(1)+"%";

const G = {
  bg:"#0B1418",      // main background
  card:"#1E293B",    // card / row highlight
  border:"#2a3a42",  // subtle borders
  text:"#FFFFFF",    // primary text / figures
  dark:"#0B1418",    // deep background
  mid:"#123A2D",     // section header fills
  light:"#C7D0D5",   // secondary labels
  pale:"#1E293B",    // highlight rows
  orange:"#F59E0B",  // accent
  pos:"#22C55E",     // positive values
  neg:"#EF4444",     // negative values
  val:"#FFFFFF",     // all KPI figures  // amber accent
  obg:"#1a2a20",     // subtle green tint bg
  val:"#FFFFFF",     // all figures white
  pos:"#22C55E",     // positive variance
  neg:"#EF4444",     // negative variance
};

const INP_manual = {width:"100%",padding:"12px 14px",background:"#1a2a20",border:"2px solid #2d55c8",borderRadius:8,color:G.val,fontFamily:"inherit",fontSize:16,outline:"none",WebkitAppearance:"none",appearance:"none",fontWeight:700};
const INP_auto   = {width:"100%",padding:"12px 14px",background:"#1E293B",border:"2px solid #1e3a8a",borderRadius:8,color:G.val,fontFamily:"inherit",fontSize:16,outline:"none",WebkitAppearance:"none",appearance:"none",fontWeight:700};

function Commentary({text}){
  if(!text) return null;
  return (
    <div style={{margin:"12px 0 20px",padding:"14px 18px",background:"#1a2a20",border:"1px solid #2d55c8",borderLeft:"4px solid #1e3a8a",borderRadius:"0 8px 8px 0",fontSize:13,color:G.val,lineHeight:1.9}}>
      {text}
    </div>
  );
}

function Legend(){
  return (
    <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20,padding:"10px 14px",background:G.card,borderRadius:8,border:"1px solid "+G.border}}>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:14,height:14,borderRadius:3,background:"#fdf8ec",border:"1.5px solid #1e3a8a",flexShrink:0}}/>
        <span style={{fontSize:12,color:G.text}}>You fill in on the visit</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:7}}>
        <div style={{width:14,height:14,borderRadius:3,background:"#1a2a20",border:"1.5px solid #2d55c8",flexShrink:0}}/>
        <span style={{fontSize:12,color:G.text}}>Auto-filled / sector average — override if needed</span>
      </div>
    </div>
  );
}

// ── Postcode lookup hook ──────────────────────────────────────────────────────
function usePostcodeLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);

  const lookup = useCallback(async (postcode) => {
    const clean = postcode.replace(/\s/g,"").toUpperCase();
    if(clean.length < 5) return;
    setLoading(true); setError(null);
    try {
      // 1. Get lat/lng from postcodes.io
      const geoRes = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
      const geoJson = await geoRes.json();
      if(geoJson.status !== 200) throw new Error("Postcode not found");
      const { latitude, longitude, admin_district, region, codes } = geoJson.result;

      // 2. ONS deprivation proxy via LSOA code
      const lsoa = codes?.lsoa || "";

      // 3. Get nearby places using Nominatim (free OSM geocoder)
      const nearbyRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=40&viewbox=${longitude-0.02},${latitude+0.02},${longitude+0.02},${latitude-0.02}&bounded=1&q=convenience+store+OR+supermarket+OR+off+licence+OR+petrol+station`,
        { headers: { "Accept-Language":"en-GB" } }
      );
      const nearbyJson = await nearbyRes.json();

      // 4. Planning applications via Planning Explorer (open data)
      // Using postcodes.io nearest endpoint for LPA info
      const lpaRes = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
      const lpaJson = await lpaRes.json();
      const lpa = lpaJson.result?.admin_district || "";

      setData({ latitude, longitude, admin_district, region, lsoa, lpa, nearbyPlaces: nearbyJson || [] });
    } catch(e) {
      setError(e.message || "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return { lookup, loading, error, data };
}

// ── Competitor Map (OpenStreetMap + Leaflet via CDN) ──────────────────────────
function CompetitorMap({ lat, lng, competitors, existingStore, comparables }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!lat || !lng || !mapRef.current) return;
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      try {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
      const L = window.L;
      const map = L.map(mapRef.current).setView([lat, lng], 15);
      mapInstance.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 19
      }).addTo(map);

      // Subject site marker — gold star
      const siteIcon = L.divIcon({
        html: `<div style="background:#1e3a8a;color:#d4af37;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:3px solid #d4af37;box-shadow:0 2px 10px rgba(0,0,0,0.4);font-weight:700">★</div>`,
        iconSize:[36,36], iconAnchor:[18,18], className:""
      });
      L.marker([lat, lng], { icon: siteIcon }).addTo(map)
        .bindPopup(`<b>📍 Subject Site</b><br>This assessment`);

      // Existing store marker — green pin
      if(existingStore) {
        const existIcon = L.divIcon({
          html: `<div style="background:#166534;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3)">🏪</div>`,
          iconSize:[30,30], iconAnchor:[15,15], className:""
        });
        L.marker([existingStore.lat, existingStore.lng], { icon: existIcon }).addTo(map)
          .bindPopup(`<b>Existing Store</b><br>${existingStore.name||"Current trading location"}`);
      }

      // Competitor markers
      (competitors || []).forEach((c, i) => {
        const col = c.threat === "high" ? "#d62828" : c.threat === "medium" ? "#e07020" : "#2d55c8";
        const icon = L.divIcon({
          html: `<div style="background:${col};color:#fff;border-radius:50%;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25)">${i+1}</div>`,
          iconSize:[26,26], iconAnchor:[13,13], className:""
        });
        L.marker([c.lat, c.lng], { icon }).addTo(map)
          .bindPopup(`<b>${c.name}</b><br>${c.type}<br>${c.distance}`);
      });

      // Comparable store pins — purple
      (comparables||[]).filter(c=>c.name&&c.lat&&c.lng&&!isNaN(c.lat)&&!isNaN(c.lng)).forEach((c,i)=>{
        const compIcon = L.divIcon({
          html: `<div style="background:#6d28d9;color:#fff;border-radius:4px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:11px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);font-weight:700">C${i+1}</div>`,
          iconSize:[28,28], iconAnchor:[14,14], className:""
        });
        L.marker([c.lat, c.lng], { icon: compIcon }).addTo(map)
          .bindPopup(`<b>Comparable ${i+1}</b><br>${c.name}${c.weeklyT>0?`<br>£${c.weeklyT.toLocaleString()}/wk`:""}`);
      });

      // 0.5 mile radius circle
      L.circle([lat, lng], { radius: 804, color: "#ffffff", fillColor:"#1e3a8a", fillOpacity:0.05, weight:1.5, dashArray:"6,4" }).addTo(map);
      } catch(mapErr) { console.error("Map init error:", mapErr); }
    }

    return () => { if(mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [lat, lng, competitors, existingStore, comparables]);

  return (
    <div>
      <div ref={mapRef} style={{height:340,borderRadius:10,border:"1px solid "+G.border,overflow:"hidden"}}/>
      <div style={{fontSize:11,color:"#FFFFFF",marginTop:6,textAlign:"center"}}>★ Subject site · 🏪 Existing store · C1/C2 Comparables · Numbers = competitors by threat · Dashed = 0.5 mile radius</div>
    </div>
  );
}

// ── AI Narrative Generator ────────────────────────────────────────────────────
function AISection({ prompt, label }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const generate = useCallback(async () => {
    if(!prompt) return;
    setLoading(true); setText(""); setDone(false);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{ role:"user", content: prompt }]
        })
      });
      const data = await res.json();
      const output = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("") || "";
      setText(output);
      setDone(true);
    } catch(e) {
      setText("");
      setDone(true);
    } finally {
      setLoading(false);
    }
  },[prompt]);

  useEffect(()=>{ generate(); },[]);

  // ── IP Protection ────────────────────────────────────────────────────────────
  useEffect(()=>{
    // Console copyright notice
    console.log('%c© Genesis Retail 2026 — Proprietary Software', 'color:#1a3c2e;font-size:16px;font-weight:bold');
    console.log('%cUnauthorised copying, reverse engineering or reproduction of this tool is strictly prohibited.', 'color:#d62828;font-size:12px');
    console.log('%cContact: rshorney@genesisretail.uk', 'color:#b8960c;font-size:12px');
    // Disable right-click on report
    const handleContext = e => {
      if(e.target.closest('.pdf-wrapper')) e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContext);
    return () => document.removeEventListener('contextmenu', handleContext);
  },[]);



  return (
    <div style={{marginBottom:16}}>
      {loading && (
        <div style={{padding:"12px 16px",background:G.card,border:"1px solid "+G.border,borderRadius:8,fontSize:13,color:G.val,fontStyle:"italic"}}>✦ Generating executive summary...</div>
      )}
      {text && (
        <div style={{fontSize:14,color:G.text,lineHeight:1.9,background:G.card,border:"1px solid "+G.border,borderRadius:8,padding:"14px 16px",whiteSpace:"pre-wrap"}}>
          {text}
          <button onClick={generate} style={{display:"block",marginTop:10,padding:"6px 12px",background:"transparent",border:"1px solid "+G.border,borderRadius:6,color:G.light,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Regenerate</button>
        </div>
      )}
    </div>
  );
}

// ── Risk Register ─────────────────────────────────────────────────────────────
function RiskRegister({ risks }) {
  const cols = { red:"#d62828", amber:"#e07020", green:"#1e3a8a" };
  return (
    <div>
      {risks.map((r, i) => (
        <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 0",borderBottom:"1px solid "+G.border}}>
          <div style={{width:10,height:10,borderRadius:50,background:cols[r.rag],flexShrink:0,marginTop:4}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:G.text}}>{r.title}</div>
            <div style={{fontSize:12,color:"#FFFFFF",marginTop:2}}>{r.detail}</div>
          </div>
          <div style={{fontSize:11,fontWeight:700,color:cols[r.rag],padding:"3px 8px",borderRadius:4,background:cols[r.rag]+"18",border:"1px solid "+cols[r.rag]+"44",flexShrink:0,whiteSpace:"nowrap"}}>{r.rag.toUpperCase()}</div>
        </div>
      ))}
    </div>
  );
}

// ── Symbol Group Scorer ───────────────────────────────────────────────────────
function SymbolGroupScorer({ location, weeklyTurnover, demographics, cats }) {
  const scores = useMemo(() => {
    return SYMBOL_GROUPS.map(sg => {
      let score = 0;
      if(sg.bestFor.includes(location)) score += 3;
      if(weeklyTurnover * 52 >= sg.minSpend * 52) score += 2;
      const alcoholMix = cats.find(c=>c.name==="Alcohol")?.mix || 11;
      if(sg.name==="Bargain Booze" && alcoholMix >= 15) score += 3;
      if(sg.name==="Budgens" && (demographics?.medianIncome||31000) >= 35000) score += 2;
      if(sg.tier==="value" && (demographics?.deprivation||5) <= 4) score += 1;
      if(sg.tier==="premium" && (demographics?.deprivation||5) >= 6) score += 1;
      return { ...sg, score: Math.min(score, 8) };
    }).sort((a,b)=>b.score-a.score);
  }, [location, weeklyTurnover, demographics, cats]);

  return (
    <div>
      {scores.map((sg, i) => (
        <div key={sg.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",marginBottom:8,background:i===0?G.pale:G.card,border:"1px solid "+(i===0?G.mid:G.border),borderRadius:10}}>
          <div style={{fontSize:13,fontWeight:i===0?800:600,color:i===0?G.text:G.text,minWidth:110}}>{i===0?"⭐ ":""}{sg.name}</div>
          <div style={{flex:1}}>
            <div style={{height:6,background:"#1E293B",borderRadius:3}}>
              <div style={{height:"100%",background:i===0?G.mid:G.light,borderRadius:3,width:(sg.score/8*100)+"%"}}/>
            </div>
            <div style={{fontSize:11,color:"#FFFFFF",marginTop:3}}>{sg.desc}</div>
          </div>
          <div style={{fontSize:13,fontWeight:700,color:i===0?"#ffffff":G.light,minWidth:30,textAlign:"right"}}>{sg.score}/8</div>
        </div>
      ))}
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────
function BarChart({data,color,height,fv}){
  color=color||G.mid; height=height||180;
  const max=Math.max(...data.map(d=>d.v),1);
  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:height,borderBottom:"2px solid "+G.border,borderLeft:"2px solid "+G.border,padding:"0 4px"}}>
        {data.map((d,i)=>(
          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,height:"100%",justifyContent:"flex-end"}}>
            <div style={{fontSize:9,color:G.light,fontWeight:600,textAlign:"center",lineHeight:1.2}}>{fv?fv(d.v):d.v}</div>
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
          <div style={{fontSize:11,fontWeight:700,color:d.v<0?G.neg:G.pos,width:80,textAlign:"right",flexShrink:0}}>{d.v<0?"("+fmt(Math.abs(d.v))+")":fmt(d.v)}</div>
        </div>
      ))}
    </div>
  );
}

function Donut({data}){
  const total=data.reduce((s,d)=>s+d.v,0)||1;
  const COLS=["#1e3a8a","#2d55c8","#2d55c8","#2d55c8","#4a6fd4","#b8e0e8","#0c1024","#0c1024","#e07020","#f4a04a","#ffd166","#2d55c8","#118ab2"];
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
            <div style={{fontSize:11,fontWeight:700,color:G.text}}>{s.pct}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Report colour palette (print-friendly) ───────────────────────────────────
const R = {
  bg:     "#FFFFFF",      // page background
  card:   "#F8FAFC",      // card / callout background
  fill:   "#F1F5F9",      // table header / section bar
  text:   "#111827",      // primary text
  muted:  "#64748B",      // labels / captions
  border: "#CBD5E1",      // all borders
  pos:    "#16A34A",      // positive / pass
  neg:    "#DC2626",      // negative / fail
  acc:    "#15803D",      // Genesis green accent
  kpi:    "#F0FDF4",      // KPI card highlight
  mid:    "#15803D",      // section headers / rules
  light:  "#64748B",      // secondary labels
  rule:   "#15803D",      // horizontal rules
  orange: "#B45309",      // amber / caution
  hi:     "#F0FDF4",      // highlight rows
  pale:   "#F8FAFC",      // alternate rows
};

// ── Report UI components ──────────────────────────────────────────────────────
function RPSH({c,n}){
  return (
    <div style={{marginBottom:18,paddingBottom:8,borderBottom:"2px solid "+R.rule}}>
      {n&&<div style={{fontSize:10,fontWeight:700,color:R.orange,textTransform:"uppercase",letterSpacing:".15em",marginBottom:2}}>{n}</div>}
      <div style={{fontSize:16,fontWeight:800,color:R.mid,letterSpacing:".01em"}}>{c}</div>
    </div>
  );
}
function RRC({t,ch}){
  return (
    <div className="avoid-break" style={{marginBottom:22,paddingBottom:18,borderBottom:"1px solid "+R.border}}>
      <div style={{fontSize:12,fontWeight:700,color:R.light,textTransform:"uppercase",letterSpacing:".1em",marginBottom:12}}>{t}</div>
      {ch}
    </div>
  );
}
function RCommentary({text}){
  if(!text) return null;
  return <div style={{fontSize:13,color:R.text,lineHeight:1.95,marginBottom:20,paddingLeft:14,borderLeft:"3px solid "+R.mid}}>{text}</div>;
}


const SH  = ({c})=><div style={{fontSize:20,fontWeight:700,color:G.text,marginBottom:18,paddingBottom:10,borderBottom:"2px solid "+G.border}}>{c}</div>;
const PSH = ({c})=><div style={{fontSize:18,fontWeight:800,color:G.text,marginBottom:16,paddingBottom:8,borderBottom:"3px solid "+G.mid}}>{c}</div>;
const Sub = ({c})=><div style={{fontSize:13,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:".08em",marginBottom:12,marginTop:4}}>{c}</div>;
const Row2= ({ch,st})=><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,...(st||{})}}>{ch}</div>;
const Fld = ({l,h,ch})=><div style={{marginBottom:16}}><div style={{fontSize:13,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>{l}</div>{h&&<div style={{fontSize:12,color:G.val,marginBottom:5}}>{h}</div>}{ch}</div>;
const S3  = ({items})=><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:20,marginBottom:8}}>{items.map(({l,v,hi})=><div key={l} style={{background:hi?"#dde4f5":G.card,border:"1.5px solid "+(hi?"#2d55c8":G.border),borderRadius:10,padding:"12px 10px",textAlign:"center"}}><div style={{fontSize:11,color:G.light,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>{l}</div><div style={{fontSize:16,fontWeight:700,color:hi?G.text:G.light}}>{v}</div></div>)}</div>;
const RC  = ({t,ch})=><div className="avoid-break" style={{background:G.card,border:"1px solid "+G.border,borderRadius:12,padding:16,marginBottom:20}}><div style={{fontSize:15,fontWeight:700,color:G.text,marginBottom:14,paddingBottom:8,borderBottom:"1px solid "+G.border}}>{t}</div>{ch}</div>;

// ── Plain-English explainer boxes ─────────────────────────────────────────────
function Explainer({term, children}){
  const [open,setOpen]=useState(false);
  return (
    <div style={{marginBottom:8}}>
      <button onClick={()=>setOpen(o=>!o)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#fdf8ec",border:"1px solid #1e3a8a",borderRadius:8,cursor:"pointer",fontFamily:"inherit",width:"100%",textAlign:"left"}}>
        <span style={{fontSize:14,color:G.val,fontWeight:700}}>? What is {term}?</span>
        <span style={{marginLeft:"auto",fontSize:14,color:"#FFFFFF"}}>{open?"▲":"▼"}</span>
      </button>
      {open&&(
        <div style={{padding:"14px 16px",background:"#1a2216",border:"1px solid #e07020",borderTop:"none",borderRadius:"0 0 8px 8px",fontSize:13,color:G.text,lineHeight:1.8}}>
          {children}
        </div>
      )}
    </div>
  );
}

function DemoSec({label,keys,values,setter}){
  const total=Object.values(values).reduce((s,v)=>s+v,0);
  return (
    <div style={{marginTop:20,marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <Sub c={label}/>
        <span style={{fontSize:12,fontWeight:700,color:Math.abs(total-100)<1?"#ffffff":G.orange}}>{total.toFixed(0)}%</span>
      </div>
      {keys.map(k=>(
        <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{fontSize:14,color:G.val,flex:1,minWidth:0}}>{k}</div>
          <div style={{width:60,height:6,background:G.pale,borderRadius:3,flexShrink:0}}><div style={{height:"100%",background:G.mid,borderRadius:3,width:values[k]+"%"}}/></div>
          <input style={{...INP_manual,width:60,flexShrink:0,padding:8,textAlign:"center"}} type="number" step="0.5" value={values[k]} onFocus={e=>e.target.select()} onChange={e=>setter(p=>({...p,[k]:e.target.value===""?0:parseFloat(e.target.value)||0}))}/>
        </div>
      ))}
    </div>
  );
}

// ── PowerPoint Export Button ──────────────────────────────────────────────────
function PPTXExportButton(props) {
  const [status, setStatus] = useState("idle"); // idle | generating | done | error
  const [msg, setMsg] = useState("");

  const generate = async () => {
    setStatus("generating");
    setMsg("Building your presentation...");
    try {
      // Compute derived financials to send
      const {propName,postcode,location,sqft,footfall,avgBasket,uplift,rent,rates,staffPct,
             utilities,otherCosts,refitCost,stockCost,financeRate,financeYears,cats,ageBands,
             catchmentPop,medianIncome,deprivation,popDensity,householdSz,
             competitors,nearestComp,parking,tHP,tPG,tNH,tFF,tRG,tVA,areaNotes,storeNote,
             C,VRD,yr5,risks} = props;
      const locLabel = {"city-centre":"city centre / transport hub","suburban":"suburban residential area","village":"village or rural location","parade":"retail parade","forecourt":"forecourt site"}[location]||location;
      const symGroups = [
        {name:"Nisa",score:7,desc:"Co-op own brand access, flexible terms"},
        {name:"Spar",score:6,desc:"Strong fresh food, good margin, wide UK coverage"},
        {name:"Budgens",score:medianIncome>=35000?6:4,desc:"Premium positioning, strong fresh, higher basket"},
        {name:"Costcutter",score:4,desc:"Value positioning, strong chilled range"},
      ];

      const payload = {
        propName:propName||"Site Assessment", postcode:postcode||"", location, locLabel,
        sqft, footfall, avgBasket, uplift, rent, rates, staffPct,
        utilities, otherCosts, refitCost, stockCost, financeRate, financeYears,
        cats, ageBands, catchmentPop, medianIncome, deprivation, popDensity, householdSz,
        competitors, nearestComp, parking, tHP, tPG, tNH, tFF, tRG, tVA, areaNotes, storeNote,
        derived: {
          wk:C.wk, ann:C.ann, uplWk:C.upliftedWk, uplAnn:C.upliftedAnn,
          blGP:C.blGP, annGP:C.annGP, stf:C.stf, annC:C.annC, ti:C.ti,
          mp:C.mp, af:C.af, eb:C.eb, nP:C.nP, roi:C.roi, pb:C.pb,
          spf:C.spf, uplSpf:C.upliftedSpf, pen:C.pen,
        },
        verdict: VRD.l,
        yr5: yr5.map(r=>({...r})),
        risks: risks.map(r=>({...r})),
        symbolGroups: symGroups,
        date: new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),
      };

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:`You are confirming receipt of a Genesis Retail site assessment for PowerPoint generation.

Site: ${payload.propName}, ${payload.postcode}
ROI: ${payload.derived.roi.toFixed(1)}%, Net Profit: £${Math.round(payload.derived.nP).toLocaleString()}, Verdict: ${payload.verdict}

Reply with ONLY this exact JSON and nothing else:
{"status":"ready","site":"${(payload.propName||"").replace(/"/g,"'")}","roi":${payload.derived.roi.toFixed(1)},"verdict":"${payload.verdict}"}`
          }]
        })
      });
      const data = await res.json();
      const txt = data.content?.find(b=>b.type==="text")?.text||"";
      
      // API confirmed — now trigger the actual PPTX download
      // Since PptxGenJS CDN is unavailable in this sandbox, we provide a 
      // rich data-filled HTML report that the user can print-to-PDF as a presentation
      // and also offer the pre-built sample deck as a reference
      setStatus("done");
      setMsg("✓ Ready — generating presentation data");
      
      // Build a printable HTML presentation and trigger download
      const fmt2 = n => "£"+Math.round(Math.abs(n)).toLocaleString("en-GB");
      const pct2 = n => n.toFixed(1)+"%";
      const html = buildHTMLPresentation(payload, fmt2, pct2);
      const blob = new Blob([html], {type:"text/html"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (payload.propName||"genesis-assessment").replace(/[^a-zA-Z0-9]/g,"-").toLowerCase()+"-presentation.html";
      a.click();
      URL.revokeObjectURL(url);
      setMsg("✓ Downloaded — open in browser, then Print → Save as PDF for a full presentation");
    } catch(e) {
      setStatus("error");
      setMsg("Generation failed: "+e.message);
    }
  };

  function buildHTMLPresentation(d, fmt2, pct2) {
    const GREEN = "#1e3a8a", DARK = "#0c1024", PALE = "#dde4f5", ORANGE = "#E07020";
    const slides = [
      // Cover
      `<div class="slide cover">
        <div class="cover-left">
          <div class="brand">GENESIS RETAIL</div>
          <h1>SITE VIABILITY<br>ASSESSMENT</h1>
          <h2>${d.propName}</h2>
          <p class="sub">${d.postcode} · ${d.locLabel}</p>
          <div class="badge-row">
            <div class="badge"><div class="badge-lbl">VERDICT</div><div class="badge-val">${d.verdict}</div></div>
            <div class="badge"><div class="badge-lbl">ROI</div><div class="badge-val">${pct2(d.derived.roi)}</div></div>
            <div class="badge"><div class="badge-lbl">NET PROFIT</div><div class="badge-val">${fmt2(d.derived.nP)}/yr</div></div>
          </div>
          <div class="prepared">Prepared by Genesis Retail · ${d.date}</div>
        </div>
        <div class="cover-right">
          <div class="kpi-title">KEY FIGURES</div>
          ${[["Post-Refit Weekly Sales",fmt2(d.derived.uplWk)],["Annual Sales",fmt2(d.derived.uplAnn)],["Gross Margin",pct2(d.derived.blGP)],["EBITDA",fmt2(d.derived.eb)],["Net Profit",fmt2(d.derived.nP)],["Total Investment",fmt2(d.derived.ti)],["Payback",d.derived.pb?d.derived.pb.toFixed(1)+" yrs":"N/A"]].map(([l,v])=>`<div class="kpi-row"><span class="kpi-lbl">${l}</span><span class="kpi-val">${v}</span></div>`).join("")}
        </div>
      </div>`,
      // Executive Summary
      `<div class="slide">
        <div class="slide-header"><h3>Executive Summary</h3><span class="site-tag">${d.propName} · ${d.postcode}</span></div>
        <div class="verdict-bar">${d.verdict.toUpperCase()} · ROI ${pct2(d.derived.roi)} · Net Profit ${fmt2(d.derived.nP)}/yr · Investment ${fmt2(d.derived.ti)} · Payback ${d.derived.pb?d.derived.pb.toFixed(1)+" years":"N/A"}</div>
        <div class="stat-grid">
          ${[["Post-Refit Annual Sales",fmt2(d.derived.uplAnn),"Based on "+d.footfall+" transactions/day"],["Gross Profit Margin",pct2(d.derived.blGP),"Blended across all categories"],["EBITDA",fmt2(d.derived.eb),pct2(d.derived.eb/d.derived.ann*100)+" of sales"],["Annual Net Profit",fmt2(d.derived.nP),"After "+d.financeRate+"% finance cost"]].map(([l,v,s])=>`<div class="stat-card"><div class="stat-lbl">${l.toUpperCase()}</div><div class="stat-val">${v}</div><div class="stat-sub">${s}</div></div>`).join("")}
        </div>
        <div class="body-text">
          <p>This report assesses the viability of the convenience retail opportunity at ${d.propName}. The site occupies a ${d.sqft.toLocaleString()} sq ft net selling area in a ${d.locLabel} and is assessed as a <strong>${d.verdict.toLowerCase()}</strong>.</p>
          <p>Post-refit, the store is projected to generate weekly sales of ${fmt2(d.derived.uplWk)} and annual sales of ${fmt2(d.derived.uplAnn)}, representing a ${d.uplift}% uplift through new ranging, symbol group affiliation and operator investment.</p>
          <p>The total capital requirement is ${fmt2(d.derived.ti)}, comprising a ${fmt2(d.refitCost)} refit and ${fmt2(d.stockCost)} opening stock. After all costs and finance charges, the business is forecast to generate a net profit of ${fmt2(d.derived.nP)} in Year 1, delivering an ROI of ${pct2(d.derived.roi)}.</p>
        </div>
      </div>`,
      // Financial KPIs
      `<div class="slide">
        <div class="slide-header"><h3>Financial Highlights</h3><span class="slide-sub">Year 1 projected figures — post-refit</span></div>
        <div class="kpi-9-grid">
          ${[["Base Weekly Turnover",fmt2(d.derived.wk),"Pre-investment baseline"],["Post-Refit Weekly Sales",fmt2(d.derived.uplWk),d.uplift+"% uplift applied"],["Annual Sales",fmt2(d.derived.uplAnn),"Post-refit Year 1"],["Gross Profit",fmt2(d.derived.annGP),pct2(d.derived.blGP)+" blended margin"],["EBITDA",fmt2(d.derived.eb),pct2(d.derived.eb/d.derived.ann*100)+" margin"],["Net Profit",fmt2(d.derived.nP),"After finance costs"],["Return on Investment",pct2(d.derived.roi),"Target: 20%+"],["Payback Period",d.derived.pb?d.derived.pb.toFixed(1)+" yrs":"N/A","From day 1 trading"],["Sales / Sq Ft / Week","£"+d.derived.uplSpf.toFixed(2),"Benchmark: £18+ (symbol group)"]].map(([l,v,s])=>`<div class="kpi9"><div class="kpi9-lbl">${l.toUpperCase()}</div><div class="kpi9-val">${v}</div><div class="kpi9-sub">${s}</div></div>`).join("")}
        </div>
      </div>`,
      // P&L
      `<div class="slide">
        <div class="slide-header"><h3>Profit & Loss Summary</h3><span class="slide-sub">Year 1 annual figures — post-refit</span></div>
        <div class="two-col">
          <table class="pl-table">
            <tr><th></th><th>£ Amount</th><th>% Sales</th></tr>
            <tr class="income-row"><td><strong>Sales Revenue</strong></td><td><strong>${fmt2(d.derived.uplAnn)}</strong></td><td><strong>100.0%</strong></td></tr>
            <tr><td style="padding-left:20px">Cost of Goods</td><td class="neg">(${fmt2(d.derived.uplAnn*(1-d.derived.blGP/100))})</td><td class="neg">${pct2(100-d.derived.blGP)}</td></tr>
            <tr class="highlight-row"><td><strong>Gross Profit</strong></td><td><strong>${fmt2(d.derived.annGP)}</strong></td><td><strong>${pct2(d.derived.blGP)}</strong></td></tr>
            <tr><td style="padding-left:20px">Rent</td><td class="neg">(${fmt2(d.rent)})</td><td class="neg">${pct2(d.rent/d.derived.uplAnn*100)}</td></tr>
            <tr><td style="padding-left:20px">Business Rates</td><td class="neg">(${fmt2(d.rates)})</td><td class="neg">${pct2(d.rates/d.derived.uplAnn*100)}</td></tr>
            <tr><td style="padding-left:20px">Staff & Wages (${d.staffPct}%)</td><td class="neg">(${fmt2(d.derived.stf)})</td><td class="neg">${pct2(d.derived.stf/d.derived.uplAnn*100)}</td></tr>
            <tr><td style="padding-left:20px">Utilities</td><td class="neg">(${fmt2(d.utilities)})</td><td class="neg">${pct2(d.utilities/d.derived.uplAnn*100)}</td></tr>
            <tr><td style="padding-left:20px">Other Costs</td><td class="neg">(${fmt2(d.otherCosts)})</td><td class="neg">${pct2(d.otherCosts/d.derived.uplAnn*100)}</td></tr>
            <tr class="ebitda-row"><td><strong>EBITDA</strong></td><td><strong>${fmt2(d.derived.eb)}</strong></td><td><strong>${pct2(d.derived.eb/d.derived.uplAnn*100)}</strong></td></tr>
            <tr><td style="padding-left:20px">Finance / Loan Cost</td><td class="neg">(${fmt2(d.derived.af)})</td><td class="neg">${pct2(d.derived.af/d.derived.uplAnn*100)}</td></tr>
            <tr class="net-row"><td><strong>NET PROFIT</strong></td><td><strong>${fmt2(d.derived.nP)}</strong></td><td><strong>${pct2(d.derived.nP/d.derived.uplAnn*100)}</strong></td></tr>
          </table>
          <div class="bar-chart-area">
            ${[["Sales",d.derived.uplAnn],["Gross Profit",d.derived.annGP],["EBITDA",d.derived.eb],["Net Profit",d.derived.nP]].map(([l,v])=>`<div class="bar-row"><div class="bar-label">${l}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,v/d.derived.uplAnn*100)}%"></div></div><div class="bar-value">${fmt2(v)}</div></div>`).join("")}
          </div>
        </div>
      </div>`,
      // 5-Year
      `<div class="slide">
        <div class="slide-header"><h3>Five-Year Financial Forecast</h3><span class="slide-sub">3% annual sales growth · 2% cost inflation</span></div>
        <table class="full-table">
          <tr><th></th>${d.yr5.map(r=>`<th>Year ${r.yr}</th>`).join("")}<th>Total</th></tr>
          ${[["Sales Revenue","s",false],["Gross Profit","gp",true],["Operating Costs","tc",false,true],["EBITDA","eb",true],["Finance Cost","fin",false,true],["NET PROFIT","np",true],["Cumulative Profit","cum",true]].map(([l,k,hi,neg])=>`<tr class="${hi?"highlight-row":""}"><td${hi?"":" style='padding-left:16px'"}><strong>${l}</strong></td>${d.yr5.map(r=>{const v=r[k]||0;return `<td class="${v<0?"neg":hi?"pos":""}">${v<0?"("+fmt2(-v)+")":fmt2(v)}</td>`}).join("")}<td class="${hi?"pos":""}">${k==="cum"?"":(() => {const tot=d.yr5.reduce((a,r)=>a+(r[k]||0),0);return tot<0?"("+fmt2(-tot)+")":fmt2(tot);})()}</td></tr>`).join("")}
        </table>
        <div class="progress-row">${d.yr5.map(r=>`<div class="prog-col"><div class="prog-lbl">Yr ${r.yr}</div><div class="prog-bar"><div class="prog-fill" style="height:${Math.max(5,Math.min(100,r.np/d.derived.nP*80))}%"></div></div><div class="prog-val">${fmt2(r.np)}</div></div>`).join("")}</div>
      </div>`,
      // Investment
      `<div class="slide">
        <div class="slide-header"><h3>Investment Summary</h3><span class="slide-sub">Capital requirement, financing and returns</span></div>
        <div class="two-col">
          <div>
            <div class="section-title">CAPITAL REQUIREMENT</div>
            <table class="simple-table">
              <tr><td>Refit Cost</td><td>${fmt2(d.refitCost)}</td></tr>
              <tr><td>Opening Stock</td><td>${fmt2(d.stockCost)}</td></tr>
              <tr class="highlight-row"><td><strong>Total Investment</strong></td><td><strong>${fmt2(d.derived.ti)}</strong></td></tr>
              <tr><td>Finance Rate (APR)</td><td>${pct2(d.financeRate)}</td></tr>
              <tr><td>Term</td><td>${d.financeYears} years</td></tr>
              <tr><td>Monthly Repayment</td><td>${fmt2(d.derived.mp)}</td></tr>
              <tr><td>Annual Finance Cost</td><td>${fmt2(d.derived.af)}</td></tr>
            </table>
          </div>
          <div>
            <div class="big-roi">${pct2(d.derived.roi)}</div>
            <div class="roi-lbl">RETURN ON INVESTMENT</div>
            <div class="roi-verdict">${d.verdict}</div>
            <div class="payback-box">${d.derived.pb?d.derived.pb.toFixed(1)+" year payback":"N/A"}</div>
            <div class="threshold-list">
              <div class="t-row green">≥ 20% ROI — Strong Opportunity</div>
              <div class="t-row amber">10–20% ROI — Viable, proceed with care</div>
              <div class="t-row red">0–10% ROI — Marginal, review costs</div>
            </div>
            <div class="lease-box">
              <div class="lease-title">MAX AFFORDABLE RENT @ 20% ROI</div>
              <div class="lease-val">${fmt2(Math.max(0,d.derived.annGP-(d.rates+d.derived.stf+d.utilities+d.otherCosts+d.derived.af+0.20*d.derived.ti)))}/yr</div>
              <div class="lease-note">Current asking: ${fmt2(d.rent)}/yr</div>
            </div>
          </div>
        </div>
      </div>`,
      // Risk Register
      `<div class="slide">
        <div class="slide-header"><h3>Risk Register</h3><span class="slide-sub">Automated assessment across key risk categories</span></div>
        <div class="risk-list">
          ${d.risks.map(r=>`<div class="risk-row ${r.rag}"><div class="risk-bar"></div><div class="risk-body"><div class="risk-title">${r.title}</div><div class="risk-detail">${r.detail}</div></div><div class="risk-badge">${r.rag==="red"?"HIGH":r.rag==="amber"?"MEDIUM":"LOW"}</div></div>`).join("")}
        </div>
        <div class="risk-legend"><span class="dot green"></span> Low Risk &nbsp;&nbsp; <span class="dot amber"></span> Medium Risk &nbsp;&nbsp; <span class="dot red"></span> High Risk</div>
      </div>`,
      // Conclusion
      `<div class="slide cover conclusion">
        <div class="cover-left">
          <div class="brand">GENESIS RETAIL</div>
          <div class="verdict-label">VERDICT</div>
          <h1>${d.verdict}</h1>
          <div class="conc-stats">
            <div><div class="cs-lbl">ROI</div><div class="cs-val">${pct2(d.derived.roi)}</div></div>
            <div><div class="cs-lbl">NET PROFIT</div><div class="cs-val">${fmt2(d.derived.nP)}/yr</div></div>
            <div><div class="cs-lbl">INVESTMENT</div><div class="cs-val">${fmt2(d.derived.ti)}</div></div>
            <div><div class="cs-lbl">PAYBACK</div><div class="cs-val">${d.derived.pb?d.derived.pb.toFixed(1)+" yrs":"N/A"}</div></div>
          </div>
        </div>
        <div class="cover-right">
          <div class="kpi-title">RECOMMENDATION</div>
          <p class="rec-text">${d.derived.roi>=20
            ? `On the basis of this assessment, ${d.propName} is rated as a <strong>${d.verdict}</strong> and Genesis Retail recommends proceeding. The financial model demonstrates an ROI of ${pct2(d.derived.roi)}, exceeding the 20% threshold. Net profit of ${fmt2(d.derived.nP)}/yr recovers the ${fmt2(d.derived.ti)} investment within ${d.derived.pb?d.derived.pb.toFixed(1)+" years":"the forecast period"}.`
            : d.derived.roi>=10
            ? `${d.propName} is rated <strong>${d.verdict}</strong>. The site is viable but returns are below the 20% target at ${pct2(d.derived.roi)}. Genesis Retail recommends proceeding only if rent can be negotiated below the current asking figure.`
            : `${d.propName} is rated <strong>${d.verdict}</strong>. Returns are insufficient to justify investment on current assumptions. A fundamental review of the cost base is required before proceeding.`
          }</p>
          <div class="disclaimer">This report has been prepared by Genesis Retail for indicative purposes only and does not constitute financial or legal advice.</div>
        </div>
      </div>`,
    ];

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${d.propName} — Genesis Retail</title>
<style>
  @media print { .slide { page-break-after: always; } body { margin:0; } }
  * { box-sizing: border-box; margin: 0; padding: 0; font-family: Calibri, Arial, sans-serif; }
  body { background: #f0f0f0; }
  .slide { width: 297mm; min-height: 167mm; background: #fff; margin: 10mm auto; padding: 0; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 2px 12px rgba(0,0,0,.15); }
  .slide-header { background: #0c1024; padding: 14px 20px 12px; display:flex; justify-content:space-between; align-items:flex-end; }
  .slide-header h3 { color: #fff; font-size: 20px; font-weight: 700; }
  .slide-sub, .site-tag { color: #8fa8d8; font-size: 10px; }
  .cover { flex-direction: row; min-height: 180mm; }
  .cover-left { background: #1e3a8a; padding: 28px 24px; width: 55%; display:flex; flex-direction:column; }
  .cover-right { background: #0c1024; padding: 28px 20px; flex: 1; }
  .brand { color: #8fa8d8; font-size: 9px; letter-spacing: 4px; font-weight: 700; margin-bottom: 8px; }
  .cover-left h1 { color: #fff; font-size: 30px; font-weight: 800; line-height: 1.15; margin-bottom: 14px; }
  .cover-left h2 { color: #dde4f5; font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .cover-left p.sub { color: #8fa8d8; font-size: 11px; margin-bottom: 18px; }
  .badge-row { display:flex; gap: 10px; margin-bottom: 16px; }
  .badge { background: #0c1024; border: 1px solid #2d55c8; padding: 8px 12px; border-radius: 4px; flex: 1; }
  .badge-lbl { color: #8fa8d8; font-size: 8px; font-weight: 700; letter-spacing: 2px; margin-bottom: 3px; }
  .badge-val { color: #fff; font-size: 15px; font-weight: 800; }
  .prepared { color: #5a6fa8; font-size: 9px; margin-top: auto; }
  .kpi-title { color: #8fa8d8; font-size: 9px; letter-spacing: 2px; font-weight: 700; margin-bottom: 12px; }
  .kpi-row { background: #0c1024; border: 1px solid #2d55c8; padding: 7px 10px; margin-bottom: 5px; display:flex; justify-content:space-between; align-items:center; }
  .kpi-lbl { color: #8fa8d8; font-size: 9px; }
  .kpi-val { color: #fff; font-size: 15px; font-weight: 800; }
  .verdict-bar { background: #1e3a8a; color: #fff; text-align:center; padding: 10px; font-size: 12px; font-weight: 700; }
  .stat-grid { display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap: 10px; padding: 14px 16px; }
  .stat-card { border: 1px solid #dde4f5; padding: 12px; background: #F4F9F6; }
  .stat-lbl { font-size: 8px; color: #5a6fa8; letter-spacing: 1px; font-weight: 700; margin-bottom: 5px; }
  .stat-val { font-size: 20px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px; }
  .stat-sub { font-size: 9px; color: #5a6fa8; }
  .body-text { padding: 0 16px 14px; flex: 1; }
  .body-text p { font-size: 10.5px; color: #334155; line-height: 1.6; margin-bottom: 8px; }
  .kpi-9-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; padding: 14px 16px; flex:1; }
  .kpi9 { border: 1px solid #dde4f5; padding: 14px; background: #F4F9F6; }
  .kpi9-lbl { font-size: 8px; color: #5a6fa8; letter-spacing: 1px; font-weight: 700; margin-bottom: 6px; }
  .kpi9-val { font-size: 22px; font-weight: 800; color: #1e3a8a; margin-bottom: 4px; }
  .kpi9-sub { font-size: 9px; color: #5a6fa8; }
  .two-col { display:flex; gap: 16px; padding: 14px 16px; flex:1; }
  .two-col > * { flex: 1; }
  table { border-collapse: collapse; width: 100%; font-size: 10.5px; }
  th { background: #1e3a8a; color: #fff; padding: 7px 10px; text-align: left; font-size: 10px; }
  td { padding: 7px 10px; border-bottom: 1px solid #dde4f5; color: #334155; }
  .highlight-row td { background: #dde4f5; font-weight: 700; color: #1e3a8a; }
  .income-row td { background: #F4F9F6; font-weight: 700; }
  .ebitda-row td { background: #dde4f5; font-weight: 700; color: #1e3a8a; }
  .net-row td { background: #b8e0e8; font-weight: 800; color: #0c1024; font-size: 12px; }
  .neg { color: #C05010 !important; }
  .pos { color: #1e3a8a !important; }
  .pl-table { font-size: 10px; }
  .bar-chart-area { padding: 10px; }
  .bar-row { display:flex; align-items:center; gap: 8px; margin-bottom: 12px; }
  .bar-label { font-size: 10px; color: #334155; width: 80px; flex-shrink:0; }
  .bar-track { flex:1; height: 22px; background: #dde4f5; border-radius: 3px; overflow:hidden; }
  .bar-fill { height: 100%; background: #1e3a8a; border-radius: 3px; }
  .bar-value { font-size: 11px; font-weight: 700; color: #1e3a8a; width: 60px; text-align:right; flex-shrink:0; }
  .full-table { font-size: 9.5px; }
  .progress-row { display:flex; gap: 12px; padding: 12px 16px 8px; align-items:flex-end; border-top: 1px solid #dde4f5; margin-top: 8px; }
  .prog-col { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; }
  .prog-lbl { font-size: 9px; color: #5a6fa8; font-weight: 700; }
  .prog-bar { width:100%; height:50px; background:#F4F9F6; border-radius:3px; display:flex; align-items:flex-end; border:1px solid #dde4f5; }
  .prog-fill { width:100%; background:#1e3a8a; border-radius:3px; min-height:3px; }
  .prog-val { font-size: 9px; color: #1e3a8a; font-weight: 700; }
  .section-title { font-size: 9px; font-weight: 700; color: #1e3a8a; letter-spacing: 2px; margin-bottom: 10px; }
  .simple-table { font-size: 10.5px; margin-bottom: 12px; }
  .big-roi { font-size: 50px; font-weight: 800; color: #1e3a8a; margin: 10px 0 4px; }
  .roi-lbl { font-size: 9px; letter-spacing: 2px; color: #5a6fa8; font-weight: 700; margin-bottom: 4px; }
  .roi-verdict { font-size: 13px; font-weight: 700; color: #1e3a8a; margin-bottom: 10px; }
  .payback-box { background: #0c1024; color: #fff; padding: 8px 14px; font-size: 14px; font-weight: 700; display:inline-block; margin-bottom: 10px; }
  .threshold-list { font-size: 9.5px; margin-bottom: 10px; }
  .t-row { padding: 3px 0; font-weight: 700; }
  .t-row.green { color: #1e3a8a; }
  .t-row.amber { color: #E07020; }
  .t-row.red { color: #D62828; }
  .lease-box { background: #F4F9F6; border: 1px solid #dde4f5; padding: 10px; }
  .lease-title { font-size: 8px; color: #5a6fa8; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 4px; }
  .lease-val { font-size: 20px; font-weight: 800; color: #1e3a8a; }
  .lease-note { font-size: 9px; color: #5a6fa8; }
  .risk-list { padding: 12px 16px; flex:1; }
  .risk-row { display:flex; align-items:stretch; border-radius: 4px; margin-bottom: 8px; overflow:hidden; border: 1px solid; }
  .risk-row.green { background: #dde4f5; border-color: #1e3a8a; }
  .risk-row.amber { background: #FFF4EA; border-color: #E07020; }
  .risk-row.red { background: #FDE8E8; border-color: #D62828; }
  .risk-bar { width: 6px; flex-shrink:0; }
  .risk-row.green .risk-bar { background: #1e3a8a; }
  .risk-row.amber .risk-bar { background: #E07020; }
  .risk-row.red .risk-bar { background: #D62828; }
  .risk-body { flex:1; padding: 8px 12px; }
  .risk-title { font-size: 11px; font-weight: 700; color: #0c1024; margin-bottom: 3px; }
  .risk-detail { font-size: 9.5px; color: #334155; }
  .risk-badge { padding: 0 12px; display:flex; align-items:center; font-size: 9px; font-weight: 800; letter-spacing: 1px; }
  .risk-row.green .risk-badge { color: #1e3a8a; }
  .risk-row.amber .risk-badge { color: #E07020; }
  .risk-row.red .risk-badge { color: #D62828; }
  .risk-legend { padding: 6px 16px; font-size: 9.5px; color: #5a6fa8; display:flex; gap:16px; border-top:1px solid #dde4f5; }
  .dot { display:inline-block; width:10px; height:10px; border-radius:50%; }
  .dot.green { background:#1e3a8a; }
  .dot.amber { background:#E07020; }
  .dot.red { background:#D62828; }
  .conclusion .cover-left h1 { font-size: 26px; }
  .verdict-label { color: #8fa8d8; font-size: 9px; letter-spacing: 3px; font-weight: 700; margin-bottom: 6px; }
  .conc-stats { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top: 16px; }
  .cs-lbl { color: #8fa8d8; font-size: 8px; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 3px; }
  .cs-val { color: #fff; font-size: 17px; font-weight: 800; }
  .rec-text { font-size: 11px; color: #dde4f5; line-height: 1.7; margin-bottom: 14px; }
  .rec-text strong { color: #fff; }
  .disclaimer { font-size: 8.5px; color: #5a6fa8; font-style: italic; margin-top: auto; }
  .print-note { text-align:center; padding: 10mm; color: #666; font-size: 12px; }
  @media print { .print-note { display:none; } }
</style></head><body>
<div class="print-note">📊 Genesis Retail — Site Viability Assessment Presentation<br>Press <strong>Ctrl+P</strong> (or Cmd+P on Mac) → <strong>Save as PDF</strong> for a bank-ready presentation</div>
${slides.join("\n")}
</body></html>`;
  }

  return (
    <button
      onClick={generate}
      disabled={status==="generating"}
      style={{width:"100%",padding:12,background:status==="generating"?"#dde4f5":G.orange,border:"none",borderRadius:8,color:status==="generating"?G.text:"#fff",cursor:status==="generating"?"default":"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}
    >
      {status==="generating"?"⟳ Generating..." : status==="done" ? "✓ " + msg : status==="error" ? "✗ Failed — retry" : "📊 Download Presentation"}
      {status==="done"&&<div style={{fontSize:10,fontWeight:400,marginTop:4,color:"#fff",lineHeight:1.4}}>{msg}</div>}
    </button>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  componentDidCatch(e, info) { console.error("Genesis Retail error:", e, info); }
  render() {
    if (this.state.error) return (
      <div style={{padding:32,textAlign:"center",fontFamily:"inherit"}}>
        <div style={{fontSize:32,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:18,fontWeight:700,color:"#FFFFFF",marginBottom:8}}>Something went wrong</div>
        <div style={{fontSize:13,color:"#FFFFFF",marginBottom:20}}>{this.state.error.message}</div>
        <button onClick={()=>this.setState({error:null})}
          style={{padding:"10px 24px",background:"#1e3a8a",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>
          Try Again
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ── AdminTab — AI Code Agent & Tools ─────────────────────────────────────────
function AdminTab({ onBack, appState }) {
  const [agentMsg, setAgentMsg] = useState("");
  const [agentRes, setAgentRes] = useState("");
  const [agentLoading, setAgentLoading] = useState(false);
  const [auditRes, setAuditRes] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);
  const [tab, setTab] = useState("agent");

  const systemPrompt = `You are an expert React developer and convenience retail analyst working on the Genesis Retail Site Viability Assessor app (App_5.jsx). 
You have deep knowledge of:
- The app's data model: all state variables, calculations, save/load logic
- Convenience retail KPIs: ROI, EBITDA, sales density, payback period, gross margin
- The report output and what banks and financiers expect to see
- The full assessment workflow across 10 tabs

When asked to audit or fix code issues, be specific about what file, function and line to change. 
When asked about the assessment data, interpret the figures like a senior retail analyst.
Always be direct, professional and concise. No AI tells.

Current assessment state: ${JSON.stringify(appState, null, 2).slice(0, 3000)}`;

  const runAgent = async () => {
    if (!agentMsg.trim()) return;
    setAgentLoading(true); setAgentRes("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: agentMsg }]
        })
      });
      const data = await res.json();
      setAgentRes(data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "No response.");
    } catch (e) { setAgentRes("Error — please try again."); }
    finally { setAgentLoading(false); }
  };

  const runAudit = async () => {
    setAuditLoading(true); setAuditRes("");
    const auditPrompt = `You are auditing the Genesis Retail Site Viability Assessor app. 

Current assessment data: ${JSON.stringify(appState, null, 2).slice(0, 2000)}

Run a complete audit across these 5 areas and report findings with a RAG status (🔴 Critical / 🟡 Warning / 🟢 OK):

1. FINANCIAL CALCULATIONS — Are all figures consistent? Does post-refit turnover flow correctly through P&L, 5-year forecast, sensitivity and all charts? Any C.ann vs C.upliftedAnn mismatches?
2. SAVE/LOAD INTEGRITY — Are all state fields being saved and restored? Any fields that could be lost on refresh?
3. REPORT COMPLETENESS — Is every tab's data represented in the Results report? Anything missing that a bank would expect?
4. DATA QUALITY — Based on the current assessment values, flag any figures that look implausible or inconsistent (e.g. unrealistic margins, zero values where data is expected)
5. UX & WORKFLOW — Any steps or fields that are confusing, missing labels, or likely to cause user errors?

For each finding give: Status · Issue · Recommended fix. Be specific.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: auditPrompt }]
        })
      });
      const data = await res.json();
      setAuditRes(data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "No response.");
    } catch (e) { setAuditRes("Error — please try again."); }
    finally { setAuditLoading(false); }
  };

  const tabs = ["agent","audit"];
  const tabLabels = { agent:"AI Assistant", audit:"Auto Audit" };

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20,paddingBottom:14,borderBottom:"2px solid "+G.mid}}>
        <button onClick={onBack} style={{padding:"6px 12px",background:"transparent",border:"1.5px solid "+G.border,borderRadius:7,color:G.light,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>← Back</button>
        <div>
          <div style={{fontSize:9,letterSpacing:".2em",color:G.orange,textTransform:"uppercase",fontWeight:700}}>Genesis Retail</div>
          <div style={{fontSize:16,fontWeight:800,color:G.text}}>Admin & AI Tools</div>
        </div>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20}}>
        {tabs.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 16px",background:tab===t?G.mid:"transparent",border:"1.5px solid "+(tab===t?G.mid:G.border),borderRadius:8,color:tab===t?"#fff":G.mid,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700}}>
            {tabLabels[t]}
          </button>
        ))}
      </div>

      {tab==="agent"&&(
        <div>
          <div style={{fontSize:13,color:"#FFFFFF",marginBottom:16,lineHeight:1.7}}>Ask anything about the app, the current assessment, the calculations or what to fix. The agent has full context of the current assessment state.</div>
          <textarea
            value={agentMsg}
            onChange={e=>setAgentMsg(e.target.value)}
            placeholder="e.g. Why is the net profit lower than expected? / Check the 5-year forecast logic / What's missing from the report for a bank submission?"
            style={{...INP_manual,minHeight:100,width:"100%",lineHeight:1.7,fontSize:14,marginBottom:10}}
          />
          <button onClick={runAgent} disabled={agentLoading||!agentMsg.trim()} style={{width:"100%",padding:13,background:agentLoading?"#8fa3d6":G.mid,border:"none",borderRadius:9,color:"#fff",cursor:agentLoading?"not-allowed":"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,marginBottom:16}}>
            {agentLoading?"Thinking...":"Ask Agent →"}
          </button>
          {agentRes&&(
            <div style={{background:G.card,border:"1.5px solid "+G.mid,borderRadius:10,padding:"16px 18px",fontSize:14,color:G.val,lineHeight:1.9,whiteSpace:"pre-wrap"}}>
              {agentRes}
              <button onClick={()=>{setAgentRes("");setAgentMsg("");}} style={{display:"block",marginTop:12,padding:"6px 12px",background:"transparent",border:"1px solid "+G.border,borderRadius:6,color:G.light,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Clear</button>
            </div>
          )}
        </div>
      )}

      {tab==="audit"&&(
        <div>
          <div style={{fontSize:13,color:"#FFFFFF",marginBottom:16,lineHeight:1.7}}>Runs a full automated audit of the app — calculations, save/load integrity, report completeness, data quality and UX. Results are flagged 🔴 Critical · 🟡 Warning · 🟢 OK.</div>
          <button onClick={runAudit} disabled={auditLoading} style={{width:"100%",padding:13,background:auditLoading?"#8fa3d6":G.mid,border:"none",borderRadius:9,color:"#fff",cursor:auditLoading?"not-allowed":"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,marginBottom:16}}>
            {auditLoading?"Running audit...":"Run Full Audit →"}
          </button>
          {auditRes&&(
            <div style={{background:G.card,border:"1.5px solid "+G.mid,borderRadius:10,padding:"16px 18px",fontSize:14,color:G.val,lineHeight:1.9,whiteSpace:"pre-wrap"}}>
              {auditRes}
              <button onClick={()=>setAuditRes("")} style={{display:"block",marginTop:12,padding:"6px 12px",background:"transparent",border:"1px solid "+G.border,borderRadius:6,color:G.light,cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App(){
  const [step,setStep]=useState(0);
  const [pdfLoading,setPdfLoading]=useState(false);
  const pdfRef=useRef(null);
  const [sheet,setSheet]=useState("pl");
  const [storePhoto,setStorePhoto]=useState(null);
  const [siteVisit,setSiteVisit]=useState({visibility:"",access:"",parking:"",fascia:"",competition:"",strengths:"",weaknesses:""});
  const [storeNote,setStoreNote]=useState("");
  const [postcodeNotes,setPostcodeNotes]=useState("");
  const [clientName,setClientName]=useState("");
  const [refitCommentary,setRefitCommentary]=useState("");
  const [genesisNote,setGenesisNote]=useState("Richard spent 23 years working at the sharp end of the UK independent convenience sector, first with A.F. Blakemore — the company behind the Spar fascia — where he worked directly with independent retailers on store development, ranging and commercial planning. In 2016 he moved to Nisa/Co-op Retail Ltd as a Retail Development Manager, managing 145 stores across North London with responsibility for around £14 million in annual turnover.\n\nDuring his time at Nisa he was consistently ranked in the national top three for new business, and several initiatives he introduced — including Too Good To Go and food delivery partnerships — were rolled out across the entire network. He knows the wholesale and symbol group world from the inside, which is exactly why independent retailers trust him to tell them the truth about their business.");
  const [propName,setPropName]=useState("");
  const [postcode,setPostcode]=useState("");
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
  const [refitCost,setRefitCost]=useState(110000);
  const [stockCost,setStockCost]=useState(40000);
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

  // Postcode data state
  const [postcodeData,setPostcodeData]=useState(null);
  const [foodProfile,setFoodProfile]=useState(null);
  const [postcodeLoading,setPostcodeLoading]=useState(false);
  const [postcodeError,setPostcodeError]=useState(null);
  const [competitorList,setCompetitorList]=useState([]);
  const [planningApps,setPlanningApps]=useState([]);
  const [mapLat,setMapLat]=useState(null);
  const [mapLng,setMapLng]=useState(null);
  const [existingStore,setExistingStore]=useState(null);

  // Comparable sites
  const [comparables,setComparables]=useState([
    {name:"",weeklyT:0,sqft:0,location:"suburban",notes:"",lat:null,lng:null},
    {name:"",weeklyT:0,sqft:0,location:"suburban",notes:"",lat:null,lng:null},
  ]);

  // Photo annotations
  const [photos,setPhotos]=useState([]);

  useEffect(()=>{
    const s=SECTOR[location];
    if(!s) return;
    setFootfall(s.footfall); setAvgBasket(s.avgBasket); setStaffPct(s.staffPct);
    setUtilities(s.utilities); setOtherCosts(s.otherCosts); setSpendBands(s.spendBands);
    setMissions({...s.missions}); setFhour({...s.fhour});
  },[location]);

  // ── Standalone competitor fetch using Google Places API ────────────────────
  const fetchCompetitors = useCallback(async (lat, lng, postcode) => {
    if(!lat || !lng) return;

    // Known competitors with hardcoded coords for specific postcodes
    const knownCompetitors = {
      "RM156NH": [
        {name:"Best-one, 1 South Road",     type:"Best-one",      lat:51.5222, lng:0.2968, threat:"high"},
        {name:"Londis, 6 South Parade",     type:"Londis",        lat:51.5220, lng:0.2965, threat:"high"},
        {name:"Tesco Express, North Road",  type:"Tesco Express", lat:51.5240, lng:0.2981, threat:"high"},
        {name:"Bargain Booze, Derry Ave",   type:"Bargain Booze", lat:51.5198, lng:0.2940, threat:"medium"},
        {name:"Nisa, Derwent Parade",       type:"Nisa",          lat:51.5185, lng:0.2910, threat:"high"},
        {name:"Tesco Express, Derry Court", type:"Tesco Express", lat:51.5195, lng:0.2935, threat:"high"},
      ],
    };

    const pcKey = (postcode||"").replace(/\s/g,"").toUpperCase();
    const known = knownCompetitors[pcKey] || [];

    // Inject known competitors immediately
    if(known.length > 0) {
      const knownWithDist = known.map(k => {
        const dlat = k.lat-lat, dlng = k.lng-lng;
        const distM = Math.round(Math.sqrt(dlat*dlat*111320*111320+dlng*dlng*103000*103000));
        return {...k, distance:(distM/1609).toFixed(2)+" miles", distM};
      }).sort((a,b)=>a.distM-b.distM);
      setCompetitorList(knownWithDist);
      setCompetitors(knownWithDist.length);
      setNearestComp(parseFloat(knownWithDist[0].distance));
    }

    // Google Places API — full UK coverage
    try {
      const GKEY = "AIzaSyB_QQUvX-Tvt5ZJD2Hj_O31wVLPQUc6k0s";
      const types = ["convenience_store","supermarket","grocery_or_supermarket","liquor_store"];
      const allPlaces = [];
      for(const type of types) {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=804&type=${type}&key=${GKEY}`;
        const res = await fetch(url);
        const data = await res.json();
        if(data.results) allPlaces.push(...data.results);
      }
      // Deduplicate by place_id
      const seen = new Set();
      const unique = allPlaces.filter(p=>{ if(seen.has(p.place_id)) return false; seen.add(p.place_id); return true; });
      const compList = unique.map(p=>{
        const elLat = p.geometry.location.lat, elLng = p.geometry.location.lng;
        const dlat = elLat-lat, dlng = elLng-lng;
        const distM = Math.round(Math.sqrt(dlat*dlat*111320*111320+dlng*dlng*103000*103000));
        const name = p.name;
        const brandLower = name.toLowerCase();
        const isMajor = ["tesco","co-op","coop","sainsbury","morrisons","lidl","aldi","spar","nisa","premier","costcutter","one stop","londis","budgens","bargain booze","iceland"].some(b=>brandLower.includes(b));
        return {name, type:p.types?.[0]||"store", lat:elLat, lng:elLng, distance:(distM/1609).toFixed(2)+" miles", distM, threat:distM<400&&isMajor?"high":distM<800&&isMajor?"medium":distM<400?"medium":"low"};
      }).sort((a,b)=>a.distM-b.distM);

      if(compList.length > 0) {
        // Merge with known — Google wins on coverage
        const existingNames = new Set(compList.map(c=>c.name.toLowerCase()));
        known.forEach(k=>{
          if(!existingNames.has(k.name.toLowerCase())){
            const dlat=k.lat-lat,dlng=k.lng-lng;
            const distM=Math.round(Math.sqrt(dlat*dlat*111320*111320+dlng*dlng*103000*103000));
            compList.push({...k,distance:(distM/1609).toFixed(2)+" miles",distM});
          }
        });
        compList.sort((a,b)=>a.distM-b.distM);
        setCompetitorList(compList.slice(0,15));
        setCompetitors(compList.length);
        setNearestComp(parseFloat(compList[0].distance));
      }
    } catch(e) { console.log("Google Places fetch failed:", e); }
  },[]);

  // ── Postcode lookup ──────────────────────────────────────────────────────
  const doPostcodeLookup = useCallback(async (pc) => {
    const clean = pc.replace(/\s/g,"").toUpperCase();
    if(clean.length < 5) return;
    setPostcodeLoading(true); setPostcodeError(null);
    try {
      const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
      const geoJson = await geoRes.json();
      if(geoJson.status !== 200) throw new Error("Postcode not found — check spelling");
      const r = geoJson.result;
      const lat = r.latitude, lng = r.longitude;
      setMapLat(lat); setMapLng(lng);
      setPostcodeData(r);

      // Auto-fill location intelligence from region
      const region = (r.region||"").toLowerCase();
      if(region.includes("london")) { setCatchmentPop(12000); setPopDensity("high"); setMedianIncome(38000); }
      else if(region.includes("south east")||region.includes("east of england")) { setCatchmentPop(9000); setPopDensity("medium"); setMedianIncome(33000); }
      else if(region.includes("north")||region.includes("yorkshire")||region.includes("midlands")) { setCatchmentPop(7500); setPopDensity("medium"); setMedianIncome(27000); }
      else { setCatchmentPop(8500); setPopDensity("medium"); setMedianIncome(30000); }

      // ── Food consumption profile — static lookup by deprivation + region ────────
      try {
        const dep = deprivation;
        const isHighDep = dep <= 4;
        const isMidDep = dep > 4 && dep <= 7;
        const isLowDep = dep > 7;
        const isLondon = (r.region||"").toLowerCase().includes("london") || (r.nuts1||"").includes("E13");
        const isEssex = (r.admin_county||"").toLowerCase().includes("essex") || (r.admin_district||"").toLowerCase().includes("thurrock");

        const profile = {
          summary: isHighDep
            ? `This is a high-deprivation catchment where value and convenience are the primary purchase drivers. Households spend a higher-than-average share of income on food and rely heavily on local convenience stores for daily essentials.`
            : isMidDep
            ? `A moderate-deprivation catchment with mixed purchase motivations — value lines remain important but there is meaningful demand for quality and range depth, particularly in chilled and fresh.`
            : `A lower-deprivation catchment where range quality, freshness and brand choice drive footfall. Customers have higher disposable income and are more likely to trade up across categories.`,
          keyInsight: isHighDep
            ? `Price-marked packs are non-negotiable in this catchment — they build trust and drive repeat visits. Stock deep on tobacco, alcohol, carbonates and frozen. World Foods and ethnic grocery will over-index significantly given the demographic profile.`
            : isMidDep
            ? `Balance value credentials with range quality. PMPs on core lines, but invest in chilled, food to go and own-brand. Customers will trade up if the range earns it.`
            : `Premium and fresh will drive basket value here. Invest in chilled, food to go, coffee and health lines. PMPs less critical — focus on availability and quality.`,
          ethnicFoodNote: isEssex || isLondon
            ? `South Asian, African and Eastern European communities are present in this catchment. World Foods — rice, lentils, spices, plantain, specialist condiments and imported soft drinks — will significantly over-index. Allocate dedicated fixture space.`
            : `Some ethnic food demand likely. Stock a core world foods range covering rice, cooking oils, spices and international soft drinks.`,
          healthTrend: isHighDep
            ? `Health consciousness is below the national average in this catchment. Functional health (vitamins, cold remedies) will sell but premium wellness products will not. Energy drinks over-index strongly.`
            : `Growing interest in healthier options. Stock meal deals with fresh options, zero-sugar alternatives and a basic health and beauty range.`,
          topFoods: [
            {category:"Tobacco & Vaping", insight: isHighDep?"Significantly above national average — key traffic driver in this catchment":"Above average — important footfall driver, ensure full range", index:isHighDep?128:110, action:"Stock full tobacco range including RYO, ensure heated tobacco products (HTP) and a strong vaping wall"},
            {category:"Alcohol & BWS", insight: isHighDep?"Strong demand for beer, cider and spirits — value brands dominate":"Good demand across BWS — mix of value and mainstream brands", index:isHighDep?118:108, action:"Prioritise price-marked cans and litre bottles. Cold beer fixture essential. Spirits above £20 will underperform"},
            {category:"Carbonates & Energy", insight:"Energy drinks significantly over-index in urban deprived areas — Monster, Lucozade, Prime", index:isHighDep?132:115, action:"Dedicate a full door of the chilled cabinet to energy drinks. Stock large formats and multipack deals"},
            {category:"World Foods", insight: isEssex||isLondon?"High demand — diverse community with strong preference for ethnic grocery":"Some demand — stock a core world foods range", index:isEssex||isLondon?125:95, action:"Allocate 4–6ft of ambient fixture to world foods: rice, oils, spices, pulses, international sauces and soft drinks"},
            {category:"Chilled & Fresh", insight: isHighDep?"Below national average but growing — chilled convenience meals and dairy core":"Good opportunity — chilled is the key basket value driver", index:isHighDep?88:105, action:isHighDep?"Stock value dairy, ready meals under £3 and basics. Avoid premium fresh — it will be slow.":"Invest in chilled run — fresh, ready meals, meal deal components. Key driver of basket growth."},
            {category:"Frozen Foods", insight:"Over-indexes in value-led catchments — chips, ready meals, pizza", index:isHighDep?115:95, action:isHighDep?"Stock a strong frozen section: chips, ready meals, pizza. Iceland proximity is a risk — compete on convenience not price.":"Core frozen range only — focus investment on chilled instead."},
          ],
          avoidCategories: isHighDep
            ? ["Premium organic/artisan", "High-end wine (£10+)", "Health supplements", "Gluten-free premium lines"]
            : ["Budget white-label lines", "Deep tobacco range beyond mainstream brands"],
        };
        setFoodProfile(profile);
      } catch(e) {
        console.log("Food profile lookup failed:", e.message);
      }

      // Fetch competitors using Google Places API
      fetchCompetitors(lat, lng, clean);

      const rateMultiplier = region.includes("london") ? 55 : region.includes("south east") ? 42 : 32;
      setRates(Math.round((sqft * rateMultiplier) / 100) * 100);

    } catch(e) {
      setPostcodeError(e.message||"Lookup failed");
    } finally {
      setPostcodeLoading(false);
    }
  }, [sqft]);

  const totalMix=cats.reduce((s,c)=>s+c.mix,0);

  // ── Auto market share (Project Retail methodology) ──────────────────────────
  const marketShareData = useMemo(()=>{
    try {
      const refitPerSqft = sqft > 0 ? refitCost / sqft : 0;
      const storeQuality  = refitPerSqft > 150 ? 18 : refitPerSqft > 80 ? 14 : refitPerSqft > 40 ? 10 : 7;
      const locationScore = {"city-centre":18,"forecourt":16,"parade":14,"suburban":13,"village":11}[location] || 12;
      const stockingScore = cats.filter(c=>c.mix>3).length > 10 ? 14 : cats.filter(c=>c.mix>3).length > 7 ? 11 : 8;
      const categoriesScore = cats.length >= 14 ? 18 : cats.length >= 10 ? 14 : 10;
      const pricingScore = 12, marketingScore = 12, serviceScore = 8;
      const availabilityScore = (openHours||16) >= 16 ? 16 : (openHours||16) >= 14 ? 12 : 9;
      const ourScore = storeQuality+locationScore+stockingScore+categoriesScore+pricingScore+marketingScore+availabilityScore+serviceScore;
      const ourServices = 26+2.4+(parking*2.8)+((openHours||16)*0.59)+94;
      const hasChilled = cats.find(c=>c.name.includes("Chilled"))?.mix > 5;
      const hasOff = cats.find(c=>c.name.includes("Alcohol"))?.mix > 8;
      const ourCatTotal = (hasChilled?18:10)+14+14+14+12+14+(hasOff?18:10)+14+18;
      const ourDet = ourScore+ourServices+ourCatTotal;
      const compDet = competitors > 3 ? 480 : competitors > 1 ? 380 : 300;
      const totalDet = ourDet+compDet;
      const marketShareFactor = totalDet > 0 ? (ourDet/totalDet)*100 : 52;
      const avgHhSpend = medianIncome > 40000 ? 82 : medianIncome > 30000 ? 70 : medianIncome > 22000 ? 60 : 52;
      const weeklyMarket = (catchmentPop/(householdSz||2.3))*avgHhSpend;
      const capturedWeekly = weeklyMarket*(marketShareFactor/100);
      const blGP_ms = cats.reduce((s,c)=>s+(c.mix/100)*c.gp,0);
      const yr1Quarterly = [0.75,0.85,0.93,1.0].map((f,q)=>({
        q:q+1, factor:f,
        sales:capturedWeekly*f*13,
        gp:capturedWeekly*f*13*blGP_ms/100,
      }));
      return {ourScore,ourServices,ourCatTotal,ourDet,compDet,totalDet,marketShareFactor,weeklyMarket,capturedWeekly,avgHhSpend,yr1Quarterly,
        scoring:{storeQuality,locationScore,stockingScore,categoriesScore,pricingScore,marketingScore,availabilityScore,serviceScore}};
    } catch(e) {
      return {ourScore:118,ourServices:180,ourCatTotal:126,ourDet:424,compDet:380,totalDet:804,
        marketShareFactor:52,weeklyMarket:77400,capturedWeekly:40000,avgHhSpend:70,
        yr1Quarterly:[{q:1,factor:0.75,sales:390000,gp:93000},{q:2,factor:0.85,sales:442000,gp:105000},{q:3,factor:0.93,sales:484000,gp:115000},{q:4,factor:1.0,sales:520000,gp:124000}],
        scoring:{storeQuality:14,locationScore:13,stockingScore:11,categoriesScore:14,pricingScore:12,marketingScore:12,availabilityScore:12,serviceScore:8}};
    }
  }, [competitors, parking, location, sqft, refitCost, cats, catchmentPop, medianIncome, householdSz, openHours]);

  const C=useMemo(()=>{
    try {
    const wk=footfall*7*avgBasket, ann=wk*52;
    const upliftedWk = wk*(1+uplift/100);
    const upliftedAnn = upliftedWk*52;
    const blGP=cats.reduce((s,c)=>s+(c.mix/100)*c.gp,0);
    const annGP=upliftedAnn*(blGP/100);
    const stf=upliftedAnn*(staffPct/100);
    const annC=rent+rates+stf+utilities+otherCosts;
    const ti=refitCost+stockCost;
    const mr=financeRate/100/12, np2=financeYears*12;
    const mp=ti*(mr*Math.pow(1+mr,np2))/(Math.pow(1+mr,np2)-1);
    const af=mp*12, eb=annGP-annC, nP=annGP-annC-af;
    const roi=ti>0?(nP/ti)*100:0, pb=nP>0?ti/nP:null;
    // Quarterly Y1 ramp-up
    const q1Factors=[0.75,0.85,0.93,1.0];
    const uplAnn2=upliftedWk*52;
    const yr1Q=q1Factors.map((f,i)=>({q:i+1,factor:f,sales:uplAnn2*f/4,gp:uplAnn2*f/4*blGP/100,np:(uplAnn2*f/4*blGP/100)-(annC+af)/4}));
    // Price index
    const priceIndex=location==="city-centre"?6:location==="forecourt"?8:location==="village"?5:4;
    // Symbol group scores
    const symGroups=[
      {name:"Nisa",     score:8, desc:"Co-op own brand access, flexible terms, strong fresh food range"},
      {name:"Spar",     score:7, desc:"Strong fresh food, good margin support, wide UK coverage"},
      {name:"Budgens",  score:medianIncome>=35000?6:4, desc:"Premium positioning, ideal for higher-income catchments"},
      {name:"Costcutter",score:4,desc:"Value positioning, strong chilled range, lower entry threshold"},
      {name:"Premier",  score:5, desc:"Flexible terms, strong tobacco and impulse range"},
      {name:"Londis",   score:5, desc:"Good value, strong BWS range, flexible ordering"},
    ];
    return {wk,ann,upliftedWk,upliftedAnn,blGP,annGP,stf,annC,ti,mp,af,eb,nP,roi,pb,spf:sqft>0?wk/sqft:0,upliftedSpf:sqft>0?upliftedWk/sqft:0,pen:catchmentPop>0?Math.min((footfall*365)/catchmentPop*100,100):0,yr1Q,priceIndex,refitCost,stockCost,symGroups};
    } catch(e) {
      console.error("C calc error:", e);
      return {wk:0,ann:0,upliftedWk:0,upliftedAnn:0,blGP:25,annGP:0,stf:0,annC:0,ti:0,mp:0,af:0,eb:0,nP:0,roi:0,pb:null,spf:0,upliftedSpf:0,pen:0,yr1Q:[],priceIndex:4,refitCost:0,stockCost:0,
        symGroups:[{name:"Nisa",score:8,desc:"Recommended"},{name:"Spar",score:7,desc:""},{name:"Budgens",score:6,desc:""},{name:"Costcutter",score:4,desc:""}]};
    }
  },[footfall,avgBasket,sqft,cats,staffPct,rent,rates,utilities,otherCosts,refitCost,stockCost,financeRate,financeYears,catchmentPop,uplift]);

  const VRD=useMemo(()=>{
    if(C.roi>=20) return {l:"Strong Opportunity",col:"#1e3a8a"};
    if(C.roi>=10) return {l:"Viable - Proceed with Care",col:"#1e3a8a"};
    if(C.roi>=0)  return {l:"Marginal - Review Costs",col:"#c05010"};
    return              {l:"Not Viable",col:"#d62828"};
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

  // Auto-generate risks
  const risks = useMemo(()=>{
    const r=[];
    const rentRatio = rent/C.upliftedAnn*100;
    if(rentRatio>15) r.push({rag:"red",title:"Rent too high relative to turnover",detail:`Rent is ${pct(rentRatio)} of projected sales. Ideal is under 10%. Negotiate hard or walk away.`});
    else if(rentRatio>10) r.push({rag:"amber",title:"Rent at upper limit",detail:`Rent is ${pct(rentRatio)} of sales. Aim to get below 10% before committing.`});
    else r.push({rag:"green",title:"Rent within acceptable range",detail:`Rent at ${pct(rentRatio)} of sales is within the target range.`});

    if(competitorList.filter(c=>c.threat==="high").length>0) r.push({rag:"red",title:"Major competitor within close proximity",detail:`${competitorList.filter(c=>c.threat==="high").length} major competitor(s) detected within 300m. Review footfall impact carefully.`});
    else if(competitors>3) r.push({rag:"amber",title:"High competitor density",detail:`${competitors} competitors within 0.5 miles. Market may be saturated.`});
    else r.push({rag:"green",title:"Competitor density manageable",detail:`${competitors} competitors within 0.5 miles — within acceptable range.`});

    if(planningApps.filter(p=>p.risk==="high").length>0) r.push({rag:"red",title:"High-risk planning applications nearby",detail:`${planningApps.filter(p=>p.risk==="high").length} approved or pending retail/food planning application(s) detected within 0.5 miles.`});
    else if(planningApps.filter(p=>p.risk==="medium").length>0) r.push({rag:"amber",title:"Planning activity in catchment",detail:"Some planning activity detected nearby. Monitor for new food retail approvals."});
    else r.push({rag:"green",title:"No significant planning conflicts detected",detail:"No high-risk retail planning applications found in the immediate catchment."});

    if(C.upliftedSpf < 12) r.push({rag:"red",title:"Sales density below benchmark",detail:`£${(C.upliftedSpf||0).toFixed(2)}/sqft/wk is below the £12 minimum benchmark for a viable convenience store. UK average independent runs at £17-19/sqft/wk.`});
    else if(C.upliftedSpf < 16) r.push({rag:"amber",title:"Sales density below symbol group average",detail:`£${(C.upliftedSpf||0).toFixed(2)}/sqft/wk is below the £16-20 benchmark for a well-performing symbol group store.`});
    else if(C.upliftedSpf < 20) r.push({rag:"green",title:"Sales density meets average",detail:`£${(C.upliftedSpf||0).toFixed(2)}/sqft/wk is in line with a well-run symbol group store (UK average £17-19/sqft/wk).`});
    else r.push({rag:"green",title:"Sales density above average",detail:`£${(C.upliftedSpf||0).toFixed(2)}/sqft/wk exceeds the UK symbol group average of £18-20/sqft/wk — strong performance.`});

    if(C.roi < 0) r.push({rag:"red",title:"Negative ROI — not viable on current assumptions",detail:"The business does not generate sufficient profit to service the investment."});
    else if(C.roi < 10) r.push({rag:"amber",title:"ROI below target threshold",detail:`${pct(C.roi)} ROI is below the 10% minimum typically required for convenience retail investment.`});
    else r.push({rag:"green",title:"ROI meets investment threshold",detail:`${pct(C.roi)} ROI meets the target threshold.`});

    if(staffPct>12) r.push({rag:"amber",title:"Staff cost ratio high",detail:`Staff at ${staffPct}% of sales is above the sector average. Review rota efficiency.`});

    return r;
  },[C,rent,competitors,competitorList,planningApps,staffPct]);

  const handlePhoto=e=>{const f=e.target.files[0];if(f){const reader=new FileReader();reader.onload=ev=>setStorePhoto(ev.target.result);reader.readAsDataURL(f);}};

  const handleAnnotatedPhoto=e=>{
    Array.from(e.target.files).forEach(f=>{
      const reader=new FileReader();
      reader.onload=ev=>setPhotos(p=>[...p,{src:ev.target.result,caption:"",tag:"exterior"}]);
      reader.readAsDataURL(f);
    });
  };

  const locLabel={"city-centre":"city centre / transport hub","suburban":"suburban residential area","village":"village or rural location","parade":"retail parade","forecourt":"forecourt site"}[location]||location;

  const yr5=useMemo(()=>[1,2,3,4,5].map(yr=>{
    const g=Math.pow(1.03,yr-1),cg=Math.pow(1.02,yr-1);
    const s=C.upliftedAnn*g,gp=s*(C.blGP/100),stf2=s*(staffPct/100);
    const tc=(rent+rates+utilities+otherCosts)*cg+stf2;
    const eb=gp-tc,fin=yr<=financeYears?C.af:0,np=eb-fin;
    return {yr,s,gp,stf2,tc,eb,fin,np};
  }),[C,staffPct,rent,rates,utilities,otherCosts,financeYears]);

  const cumNp=yr=>yr5.slice(0,yr).reduce((a,r)=>a+r.np,0);


  const aiPrompt = useMemo(()=>`
You are a senior convenience retail analyst at Genesis Retail writing a professional site viability assessment report section.

Site: ${propName||"unnamed site"}, Postcode: ${postcode}, Location type: ${locLabel}
Financial: Weekly sales ${fmt(C.wk)}, Post-refit weekly ${fmt(C.upliftedWk)}, Annual sales ${fmt(C.ann)}, Gross margin ${pct(C.blGP)}, Net profit ${fmt(C.nP)}, ROI ${pct(C.roi)}, Payback ${C.pb?(C.pb||0).toFixed(1)+" years":"N/A"}, Total investment ${fmt(C.ti)}
Catchment: Population ${catchmentPop.toLocaleString()}, Median income ${fmt(medianIncome)}, Deprivation ${deprivation}/10, Density: ${popDensity}
Traffic: ${traffic.roadVehicles} vehicles/day, ${traffic.pedestrians} pedestrians/day, Bus stop: ${traffic.busStop?"yes":"no"}, Train station: ${traffic.trainStation?"yes":"no"}
Competitors: ${competitors} within 0.5 miles, nearest ${nearestComp} miles
Area trends: House prices ${tHP}, Population ${tPG}, Footfall ${tFF}, Regeneration ${tRG}
Overall verdict: ${VRD.l}
${areaNotes?"Additional notes: "+areaNotes:""}\n${refitCommentary?"Refit plan: "+refitCommentary:""}

Write a concise, professional 4-paragraph executive summary for this site assessment. Be specific to the numbers. Use formal surveyor-style language suitable for both the retailer and their bank. Do not use bullet points. Do not use section headers. Do not use phrases like "For the Retailer" or "For the Bank". Paragraph 1: overall verdict and ROI — explain what the ROI figure means in plain terms. Paragraph 2: trading performance, catchment and post-refit uplift. Paragraph 3: risk factors, competition and any planning considerations. Paragraph 4: recommendation and next steps.
  `, [propName,postcode,locLabel,C,catchmentPop,medianIncome,deprivation,popDensity,traffic,competitors,nearestComp,tHP,tPG,tFF,tRG,VRD,areaNotes]);

  // ── Save / Restore ──────────────────────────────────────────────────────────
  const [savedAssessments, setSavedAssessments] = useState(()=>{
    try { return JSON.parse(localStorage.getItem("genesis_assessments")||"[]"); } catch{ return []; }
  });
  const [saveMsg, setSaveMsg] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const isLoading = useRef(false);

  const gatherState = useCallback(()=>({
    propName,postcode,sqft,location,footfall,avgBasket,openHours,uplift,clientName,postcodeNotes,
    rent,rates,staffPct,utilities,otherCosts,refitCost,stockCost,financeRate,financeYears,
    cats,ageBands,employment,housing,popDensity,catchmentPop,medianIncome,deprivation,householdSz,
    spendBands,peakDay,peakHour,morningTrade,lunchTrade,eveningTrade,missions,
    traffic,fhour,competitors,nearestComp,parking,
    tHP,tPG,tNH,tFF,tRG,tVA,areaNotes,storeNote,genesisNote,refitCommentary,
    competitorList,planningApps,mapLat,mapLng,
    comparables,foodProfile,existingStore,siteVisit,
    savedAt: new Date().toISOString(),
  }),[propName,postcode,sqft,location,footfall,avgBasket,openHours,uplift,rent,rates,staffPct,utilities,otherCosts,refitCost,stockCost,financeRate,financeYears,cats,ageBands,employment,housing,popDensity,catchmentPop,medianIncome,deprivation,householdSz,spendBands,peakDay,peakHour,morningTrade,lunchTrade,eveningTrade,missions,traffic,fhour,competitors,nearestComp,parking,tHP,tPG,tNH,tFF,tRG,tVA,areaNotes,storeNote,genesisNote,refitCommentary,competitorList,planningApps,mapLat,mapLng,comparables,foodProfile]);

  const saveAssessment = useCallback(()=>{
    try {
      const state = gatherState();
      // Don't save cats - always use ACS defaults on load
      delete state.cats;
      const existing = JSON.parse(localStorage.getItem("genesis_assessments")||"[]");
      const idx = existing.findIndex(a=>a.propName===state.propName);
      if(idx>=0) existing[idx]=state; else existing.unshift(state);
      const trimmed = existing.slice(0,20);
      localStorage.setItem("genesis_assessments", JSON.stringify(trimmed));
      setSavedAssessments(trimmed);
      setSaveMsg("✓ Saved");
      setTimeout(()=>setSaveMsg(""),2500);
    } catch(e){ setSaveMsg("Save failed"); }
  },[gatherState])

  // Phase 1: Write draft to localStorage after every render (no deps = runs always)
  // Phase 2: Debounced Supabase cloud save added below — localStorage always runs first
  useEffect(()=>{
    try {
      const data = gatherState();
      delete data.cats;
      // Embed stable assessmentId so cloud upsert targets the same row always
      data.assessmentId = assessmentIdRef.current;
      if(data.propName || data.postcode){
        localStorage.setItem("genesis-assessment-draft", JSON.stringify(data));
      }
    } catch(e){}
  });

  // Phase 2: Supabase cloud save — isolated, fire-and-forget, stable ID per session
  const [cloudStatus, setCloudStatus] = useState("");
  const cloudSaveTimerRef = useRef();
  const assessmentIdRef = useRef(
    // Stable ID — persists in localStorage so rename doesn't create new row
    (()=>{
      const stored = localStorage.getItem("genesis-assessment-id");
      if(stored) return stored;
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)+Date.now().toString(36);
      localStorage.setItem("genesis-assessment-id", id);
      return id;
    })()
  );
  const SBU2 = "https://drtpeodthflxkzjgbfvu.supabase.co";
  const SBK2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydHBlb2R0aGZseGt6amdiZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDk5OTUsImV4cCI6MjA5NjIyNTk5NX0.HMr2i61gILTiVD7uPFBJP8ek_ImLgTxQj6tiBUkNzlc";

  // saveDraftToCloud — fire-and-forget upsert by stable assessmentId
  const saveDraftToCloud = async (data) => {
    if(!data || (!data.propName && !data.postcode)) return;
    const id = data.assessmentId || assessmentIdRef.current;
    const hdrs = {"apikey":SBK2,"Authorization":"Bearer "+SBK2,"Content-Type":"application/json","Prefer":"resolution=merge-duplicates,return=minimal"};
    // Upsert by id — same row forever regardless of prop_name changes
    const body = JSON.stringify({
      id: id,
      prop_name: data.propName||"draft",
      postcode: data.postcode||"",
      data: data,
      updated_at: new Date().toISOString()
    });
;


  // ── Autosave — always fires, no propName requirement ────────────────────────
  useEffect(()=>{
    const timer = setTimeout(()=>{
      if(isLoading.current) return; // don't overwrite during load
      try {
        const state = gatherState();
        delete state.cats;
        const existing = JSON.parse(localStorage.getItem("genesis_assessments")||"[]");
        const idx = existing.findIndex(a=>
          (state.propName && a.propName===state.propName) ||
          (!state.propName && state.postcode && a.postcode===state.postcode) ||
          (!state.propName && !state.postcode && a.propName==="draft")
        );
        if(!state.propName) state.propName = state.postcode || "draft";
        if(idx>=0) existing[idx]=state; else existing.unshift(state);
        localStorage.setItem("genesis_assessments", JSON.stringify(existing.slice(0,20)));
        setLastSaved("Saved "+new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}));
        setSavedAssessments(existing.slice(0,20));
      } catch(e){}
    }, 1000);
    return ()=>clearTimeout(timer);
  },[gatherState]);

  // ── Warn before closing/refreshing ──────────────────────────────────────────
  useEffect(()=>{
    const handler = (e)=>{ e.preventDefault(); e.returnValue=""; };
    window.addEventListener("beforeunload", handler);
    return ()=>window.removeEventListener("beforeunload", handler);
  },[]);

  const loadAssessment = useCallback((saved)=>{
    isLoading.current = true;
    setTimeout(()=>{ isLoading.current = false; }, 4000);
    setPropName(saved.propName||""); setPostcode(saved.postcode||""); setSqft(saved.sqft||800);
    setLocation(saved.location||"suburban"); setFootfall(saved.footfall||400); setAvgBasket(saved.avgBasket||6.80);
    setOpenHours(saved.openHours||16); setUplift(saved.uplift||15);
    setRent(saved.rent||18000); setRates(saved.rates||6000); setStaffPct(saved.staffPct||9);
    setUtilities(saved.utilities||9000); setOtherCosts(saved.otherCosts||8000);
    setRefitCost(saved.refitCost||110000); setStockCost(saved.stockCost||40000);
    setFinanceRate(saved.financeRate||8); setFinanceYears(saved.financeYears||5);
    setCats(CATS0.map(c=>({...c})));  // Always reset to ACS 2025 defaults on load
    if(saved.ageBands) setAgeBands(saved.ageBands);
    if(saved.employment) setEmployment(saved.employment);
    if(saved.housing) setHousing(saved.housing);
    setPopDensity(saved.popDensity||"medium"); setCatchmentPop(saved.catchmentPop||8500);
    setMedianIncome(saved.medianIncome||31000); setDeprivation(saved.deprivation||5);
    setHouseholdSz(saved.householdSz||2.4);
    if(saved.spendBands) setSpendBands(saved.spendBands);
    setPeakDay(saved.peakDay||"Friday"); setPeakHour(saved.peakHour||"12-2pm");
    setMorningTrade(!!saved.morningTrade); setLunchTrade(!!saved.lunchTrade); setEveningTrade(!!saved.eveningTrade);
    if(saved.missions) setMissions(saved.missions);
    if(saved.traffic) setTraffic(saved.traffic);
    if(saved.fhour) setFhour(saved.fhour);
    setCompetitors(saved.competitors||2); setNearestComp(saved.nearestComp||0.3); setParking(saved.parking||4);
    setTHP(saved.tHP||"Stable"); setTPG(saved.tPG||"Stable"); setTNH(saved.tNH||"Stable");
    setTFF(saved.tFF||"Stable"); setTRG(saved.tRG||"Stable"); setTVA(saved.tVA||"Stable");
    if(saved.areaNotes) setAreaNotes(saved.areaNotes);
    if(saved.storeNote) setStoreNote(saved.storeNote);
    setGenesisNote(saved.genesisNote||"Richard spent 23 years working at the sharp end of the UK independent convenience sector, first with A.F. Blakemore — the company behind the Spar fascia — where he worked directly with independent retailers on store development, ranging and commercial planning. In 2016 he moved to Nisa/Co-op Retail Ltd as a Retail Development Manager, managing 145 stores across North London with responsibility for around £14 million in annual turnover.\n\nDuring his time at Nisa he was consistently ranked in the national top three for new business, and several initiatives he introduced — including Too Good To Go and food delivery partnerships — were rolled out across the entire network. He knows the wholesale and symbol group world from the inside, which is exactly why independent retailers trust him to tell them the truth about their business.");
    if(saved.postcodeNotes) setPostcodeNotes(saved.postcodeNotes);
    if(saved.clientName) setClientName(saved.clientName);
    if(saved.refitCommentary) setRefitCommentary(saved.refitCommentary);
    if(saved.foodProfile) setFoodProfile(saved.foodProfile);
    if(saved.existingStore) setExistingStore(saved.existingStore);
    if(saved.siteVisit) setSiteVisit(saved.siteVisit);
    if(saved.competitorList) setCompetitorList(saved.competitorList);
    if(saved.planningApps) setPlanningApps(saved.planningApps);
    if(saved.mapLat) setMapLat(saved.mapLat); if(saved.mapLng) setMapLng(saved.mapLng);
    if(saved.comparables) setComparables(saved.comparables);
    setPostcodeData(saved.mapLat ? {latitude:saved.mapLat,longitude:saved.mapLng} : null);
    // Re-inject known competitors if list is empty or missing
    if((!saved.competitorList || saved.competitorList.length===0) && saved.mapLat && saved.postcode) {
      setTimeout(()=>fetchCompetitors(saved.mapLat, saved.mapLng, saved.postcode), 500);
    }
    setStep(1);
  },[])

  // Phase 1: Restore draft on mount (after loadAssessment is defined)
  useEffect(()=>{
    const draft = localStorage.getItem("genesis-assessment-draft");
    if(!draft) return;
    try {
      const saved = JSON.parse(draft);
      if(saved && (saved.propName || saved.postcode)){
        loadAssessment(saved);
      }
    } catch(e){ console.error("Draft restore failed:", e); }
  },[loadAssessment]);;

  // ── Share / Lock ─────────────────────────────────────────────────────────────
  const [shareMode,  setShareMode]  = useState(false);
  const [sharePin,   setSharePin]   = useState("");
  const [pinInput,   setPinInput]   = useState("");
  const [pinError,   setPinError]   = useState(false);
  const [showShare,  setShowShare]  = useState(false);
  const [sharePayload, setSharePayload] = useState(null);

  // Encode state as base64 share token (obfuscated, not encrypted — sufficient for casual reverse-engineering protection)
  const generateShareToken = useCallback((pin)=>{
    const state = gatherState();
    // Strip photos to keep token manageable
    const payload = {...state, storePhoto: null, photos: []};
    const json = JSON.stringify(payload);
    // XOR obfuscation with pin as key (not cryptographic but prevents casual inspection)
    const key = pin.split("").map(c=>c.charCodeAt(0));
    const obfuscated = Array.from(json).map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key[i%key.length])).join("");
    return btoa(obfuscated);
  },[gatherState]);

  const generateShareURL = useCallback(()=>{
    if(!sharePin || sharePin.length < 4) return null;
    const token = generateShareToken(sharePin);
    // In production this would be a real URL; in the artifact we show a copy-able share string
    return `GENESIS-SHARE::${token}::${sharePin.length}`;
  },[sharePin, generateShareToken]);

  const [loadToken, setLoadToken] = useState("");
  const [loadPin,   setLoadPin]   = useState("");
  const [loadError, setLoadError] = useState("");

  const decodeShareToken = useCallback((token, pin)=>{
    try {
      const parts = token.split("::");
      if(parts[0]!=="GENESIS-SHARE") return null;
      const encoded = parts[1];
      const key = pin.split("").map(c=>c.charCodeAt(0));
      const decoded = Array.from(atob(encoded)).map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key[i%key.length])).join("");
      return JSON.parse(decoded);
    } catch(e){ return null; }
  },[]);

  // ── Sensitivity table ────────────────────────────────────────────────────────
  const sensitivityData = useMemo(()=>{
    const footfallSteps = [-20,-10,0,+10,+20];
    const rentSteps     = [-20,-10,0,+10,+20];
    return footfallSteps.map(fp=>{
      return rentSteps.map(rp=>{
        const adjF = footfall*(1+fp/100);
        const adjR = rent*(1+rp/100);
        const wk2  = adjF*7*avgBasket*(1+uplift/100);
        const ann2 = wk2*52;
        const gp2  = ann2*(C.blGP/100);
        const stf2 = ann2*(staffPct/100);
        const cost2= adjR+rates+stf2+utilities+otherCosts;
        const eb2  = gp2-cost2;
        const np2  = eb2-C.af;
        const roi2 = C.ti>0?(np2/C.ti)*100:0;
        return {fp,rp,roi:roi2,np:np2};
      });
    });
  },[footfall,rent,avgBasket,uplift,C,staffPct,rates,utilities,otherCosts]);
  // ── Dynamic commentary — bank-grade, human-written tone ──────────────────────
  const commentary = useMemo(()=>{
    const topCat = [...cats].sort((a,b)=>b.mix-a.mix)[0];
    const tobaccoMix = cats.find(c=>c.name.includes("Tobacco"))?.mix||0;
    const alcoholMix = cats.find(c=>c.name.includes("Alcohol"))?.mix||0;
    const chilledMix = cats.find(c=>c.name.includes("Chilled"))?.mix||0;
    const hotFoodMix = cats.find(c=>c.name.includes("Hot Food"))?.mix||0;
    const peakHourVal = Math.max(...FHOURS.map(h=>fhour[h]||0));
    const peakHourKey = FHOURS.find(h=>fhour[h]===peakHourVal)||"12-2pm";
    const topMission = MISSIONS.reduce((a,b)=>missions[a]>missions[b]?a:b);
    const highBasket = spendBands.s10+spendBands.s15+spendBands.s20;
    const highThreatComps = competitorList.filter(c=>c.threat==="high").length;
    const rentRatio = rent/C.upliftedAnn*100;
    const staffRatio = C.stf/C.upliftedAnn*100;
    const ebitdaMargin = C.eb/C.upliftedAnn*100;
    const totalCostRatio = C.annC/C.upliftedAnn*100;
    const workingAge = (ageBands["18-24"]||0)+(ageBands["25-34"]||0)+(ageBands["35-44"]||0)+(ageBands["45-54"]||0);
    const socialHousing = housing["Social / Council"]||0;
    const ownerOccupied = housing["Owner Occupied"]||0;
    const fullTimeEmployed = employment["Employed Full-Time"]||0;
    const redRisks = risks.filter(r=>r.rag==="red").length;
    const amberRisks = risks.filter(r=>r.rag==="amber").length;
    const highRiskPlanning = planningApps.filter(p=>p.risk==="high").length;
    const roiVerdict = C.roi>=20?"strong":C.roi>=10?"viable but tight":"below target";
    const paybackVerdict = C.pb&&C.pb<=4?"excellent":C.pb&&C.pb<=6?"acceptable":"extended";
    const spfVerdict = C.upliftedSpf>=20?"well above the symbol group average":C.upliftedSpf>=16?"in line with the symbol group average":C.upliftedSpf>=12?"below the symbol group average but above the independent minimum":"below the independent minimum";

    return {

      financial: [
        `Post-refit, the store is projected to turn over ${fmt(C.upliftedWk)} per week — ${fmt(C.upliftedAnn)} annually. This is built on a current base of ${fmt(C.wk)}/week, with a ${uplift}% uplift applied to reflect the larger unit, improved format, extended range and the trading benefit of symbol group affiliation.`,
        `The blended gross margin of ${pct(C.blGP)} is ${C.blGP>=26?"above the convenience sector average of 24–26%, reflecting a well-structured category mix.":"within the convenience sector average range of 24–26%."}. After all costs — rent, rates, staff, utilities and finance — the business is forecast to deliver a net profit of ${fmt(C.nP)} in Year 1. That represents a ${pct(C.roi)} return on the total investment of ${fmt(C.ti)}, which is ${roiVerdict} by Genesis Retail standards.`,
        `The payback period of ${C.pb?C.pb.toFixed(1)+" years":"N/A"} is ${paybackVerdict} — ${C.pb&&C.pb<=4?"well inside the 4-year benchmark that lenders and operators look for in convenience retail.":C.pb&&C.pb<=6?"within the 4–6 year range generally considered acceptable for this type of investment.":"above the 6-year marker. This does not make the investment unviable, but it does mean the operator will need to be confident in the trading projections before committing."}`,
        `Sales density of £${(C.upliftedSpf||0).toFixed(2)} per square foot per week is ${spfVerdict} of £16–20. ${C.upliftedSpf<16?"Improving this figure should be a priority — a broader chilled and food-to-go range is the most reliable way to drive sales per square foot in a convenience store of this type.":"This is a credible figure and consistent with well-run stores in similar locations."}`
      ].join(" "),

      risks: [
        `The risk assessment has flagged ${redRisks} red item${redRisks!==1?"s":""} and ${amberRisks} amber item${amberRisks!==1?"s":""}. ${redRisks>0?"Red flags represent material risks to the investment case and should be resolved before heads of terms are agreed.":"There are no red flags — on the metrics assessed, this site does not carry any immediately disqualifying risks."}`,
        `Rent is running at ${pct(rentRatio)} of projected post-refit turnover. ${rentRatio>15?"The Genesis Retail threshold is 10% — at "+pct(rentRatio)+" this is the most significant financial risk in this assessment. The operator should negotiate hard on the lease before exchange. Every pound off the annual rent drops directly to the bottom line.":rentRatio>10?"This sits above the 10% target. It is not a dealbreaker, but the operator should make every effort to bring it down before signing.":"This is within the 10% target range and does not represent a structural risk to the business."}`,
        highThreatComps>0
          ? `There ${highThreatComps===1?"is":"are"} ${highThreatComps} major competitor${highThreatComps>1?"s":""} within 300 metres that the trading projections need to account for. The operator's existing customer relationships and knowledge of this catchment are the strongest mitigant against this risk.`
          : `No high-threat competitors were identified within 300 metres. The nearest competitor is ${nearestComp} miles away, which offers reasonable insulation from direct head-to-head competition on the core convenience mission.`,
        highRiskPlanning>0
          ? `Planning data shows ${highRiskPlanning} high-risk application${highRiskPlanning>1?"s":""} in the immediate area. These must be verified directly with the Local Planning Authority before any commitment is made — a competing food retail consent within walking distance would materially affect the projections in this report.`
          : ""
      ].filter(Boolean).join(" "),

      symbolGroup: [
        `The symbol group scoring model has ranked the options above based on location type, projected turnover, catchment profile and category mix. The top-ranked group is the best fit on the assessed criteria — but the final decision should always involve a formal conversation with the wholesaler about terms, ranging support and the refit contribution they are prepared to offer.`,
        alcoholMix>=15
          ? `The BWS mix of ${pct(alcoholMix)} is strong, which adds weight to any group with a specialist drinks offer.`
          : "",
        deprivation<=4
          ? `Given the deprivation index of ${deprivation}/10, price perception will matter to this customer base. A group with strong PMP coverage and a value-led own-brand range will trade better here than a premium fascia.`
          : medianIncome>=35000
          ? `The catchment income profile of ${fmt(medianIncome)} median household income is strong enough to support a mid-tier or premium fascia — customers here will respond to quality and range depth.`
          : `The catchment sits in the mainstream — a well-supported mid-tier group is the right fit, balancing value credentials with enough ranging flexibility to build a credible fresh and chilled offer.`,
        `Whichever group is selected, the operator should negotiate the refit terms, minimum weekly drop and exclusivity clauses carefully. These are the three areas where independent retailers most often find themselves locked into unfavourable positions.`
      ].filter(Boolean).join(" "),

      competitors: [
        competitorList.length>0
          ? `The map shows ${competitorList.length} competitor${competitorList.length!==1?"s":""} identified within the catchment via open mapping data. ${highThreatComps>0?highThreatComps+" of these are rated high threat — typically a major multiple or established symbol group store within 300 metres.":"None are rated high threat at this point."}`
          : `No competitors were automatically identified within the catchment from open mapping data. This should be verified on the ground during the site visit — the tool sources from public data and may not reflect every operator.`,
        nearestComp>0
          ? `The nearest competitor is ${nearestComp} miles away. ${nearestComp<0.25?"At this distance, the two stores are effectively competing for the same passing trade and the same top-up mission. The operator will need to be better — on range, on availability, on service — not just present.":nearestComp<0.5?"Within half a mile, this is close enough to feel in day-to-day trading, particularly if the competitor holds a stronger fresh food offer or a more prominent fascia.":"This is a comfortable buffer for a convenience store. The majority of convenience shopping happens within a 5-minute walk, so beyond half a mile the competitive impact diminishes significantly."}`
          : "",
        highRiskPlanning>0
          ? `Planning activity nearby is worth monitoring closely. An approved food retail unit within this catchment — even if currently vacant — represents a potential future competitive risk that is not yet visible in the trading figures.`
          : `No significant planning activity was detected in the catchment. The competitive position as assessed appears stable.`
      ].filter(Boolean).join(" "),

      categories: [
        `The largest category by sales mix is ${topCat?.name} at ${topCat?.mix}%, contributing around ${fmt(C.upliftedAnn*(topCat?.mix||0)/100)} to annual turnover.`,
        tobaccoMix>=18
          ? `Tobacco and vaping at ${pct(tobaccoMix)} is in line with — or above — the national convenience average of 18.8% (ACS 2025). This category drives high-frequency visits and is important to protect, but its long-term trajectory is downward due to regulatory pressure. The operator should be actively building alternative traffic drivers — hot drinks, food to go, chilled — to reduce dependency over time.`
          : `Tobacco at ${pct(tobaccoMix)}% is below the sector average. Ensure the range is wide enough to retain the tobacco customer, who typically shops multiple categories in the same visit.`,
        chilledMix<12
          ? `Chilled foods at ${pct(chilledMix)} is below the sector average of 12.9%. The additional space in the new unit should be used to build a proper chilled run — dairy, fresh, ready meals, sandwiches. Chilled is the single biggest driver of basket value growth in a convenience store and customers increasingly expect it.`
          : `Chilled foods at ${pct(chilledMix)} is ${chilledMix>=15?"strong":"healthy"} — this is a key category for driving basket value and repeat visits.`,
        hotFoodMix>0
          ? `Hot food and drinks to go carries the highest gross margin of any category in the mix at 55%+. At ${pct(hotFoodMix)} of the mix it is ${hotFoodMix>=3?"already contributing meaningfully":"currently a small part of the range"} — there is a strong case for investing in equipment and fixture space to grow this in the refit.`
          : "",
        `The blended gross margin of ${pct(C.blGP)} is ${C.blGP>=26?"above the convenience sector average of 24–26%. This is partly a function of the category mix — categories like confectionery, health and beauty and hot food carry significantly higher margins than tobacco and fresh milk, which are included here at their sector averages.":"broadly in line with the convenience sector average of 24–26%. There is scope to improve this over time by growing the higher-margin categories — chilled, food to go and health and beauty — relative to the lower-margin volume drivers."}`
      ].filter(Boolean).join(" "),

      footfall: [
        `The peak trading hour is ${peakHourKey}, accounting for ${peakHourVal}% of daily footfall. ${peakHourKey.includes("12")||peakHourKey.includes("2pm")?"A lunchtime peak indicates strong demand for food to go and meal deals. The entrance area should be set up to capture this customer on the way in — a hot food and snacking fixture at eye level as they enter is the standard approach in well-run convenience stores.":peakHourKey.includes("8am")||peakHourKey.includes("6am")?"A morning commuter peak calls for coffee, pastries and grab-and-go lines to be prominent and available from opening. This customer has limited time — speed of service and availability are the critical metrics, not price.":"Trading is spread across the day, which is typical of a residential parade store serving multiple missions. The layout should reflect this — it needs to work for the quick top-up, the lunch grab and the evening meal solution without any one mission compromising the others."}`,
        `The dominant shopping mission is ${topMission} at ${missions[topMission]}%. ${topMission==="Top-up"?"This is the bread-and-butter of convenience retail. The store layout needs to support speed and familiarity — regular customers should be able to get in, find what they need and get out quickly. Every fixture change needs to be considered against how it affects the top-up customer.":topMission==="Grab and Go"?"Grab and go customers are high frequency but low dwell time. Range availability, strong impulse lines at the till and a clean, fast checkout experience are the priorities.":topMission==="Food to Go"?"A food-to-go dominant mission is a real opportunity — this is the highest-margin trade in the store. The refit plan should put food to go at the centre of the layout, not as an afterthought.":"This mission profile points to a store that does meaningful work as a local food shop, not just a convenience top-up point. Deeper ranging, a stronger fresh offer and extended chilled capacity will hold and grow this customer."}`,
        highBasket>=30
          ? `${pct(highBasket)} of transactions are £10 or above, which is a strong indicator that customers are treating this store as a regular food shop rather than a quick top-up point. This should be reflected in the depth of range — particularly in chilled, grocery and ambient.`
          : `The majority of baskets are under £10, which is consistent with a high-frequency top-up mission. Growing average basket size — through meal deals, cross-category ranging and the introduction of a stronger food-to-go offer — is one of the most reliable levers for improving overall store profitability.`
      ].join(" "),

      demographics: [
        `With a catchment population of ${catchmentPop.toLocaleString()} within one mile, the store has a penetration rate of ${pct(C.pen)}. ${C.pen>=20?"This is a strong penetration rate and suggests the store already plays an important role in the local food economy. The challenge is to hold that share and grow basket rather than grow footfall.":C.pen>=15?"This is above the 15% benchmark for a viable convenience store and indicates a healthy customer base to build on.":"This is below the 15% benchmark. Building penetration will require the store to give customers a reason to choose it over alternatives — a cleaner, more comprehensive offer post-refit is the most direct way to achieve this."}`,
        `The working-age population of 18–54 accounts for ${pct(workingAge)} of the catchment. ${workingAge>=55?"This is a strong working-age proportion — it supports demand across all trading periods and justifies investment in food to go, coffee and a decent lunch offer alongside the core convenience range.":"This is a slightly lower working-age proportion than average. The store should still cover all missions, but the emphasis on grab-and-go and food to go should be calibrated against the actual daytime footfall pattern observed on the visit."}`,
        `${socialHousing>=25?`Social and council housing accounts for ${pct(socialHousing)} of housing tenure — a significant proportion. Price-marked packs are not optional in a catchment like this, they are expected. Own-brand ranges, value tiers and consistent pricing on everyday lines will be central to building loyalty with this customer base.`:ownerOccupied>=60?`Owner occupation at ${pct(ownerOccupied)} is above average, which typically points to a more settled, higher-spending customer base with less price sensitivity than a predominantly rented catchment. The operator has room to invest in quality and range breadth.`:`The tenure mix reflects a broadly mainstream catchment. A balanced approach — covering value lines without compromising on the quality and range that attract higher-spending customers — is the right positioning.`}`,
        `A median household income of ${fmt(medianIncome)} ${medianIncome>=35000?"is above the national average and supports a fuller, better-quality convenience offer. Customers here will pay for freshness, range and service.":medianIncome>=27000?"sits broadly in line with the national average. Mainstream pricing, a solid symbol group range and a clean store will be the foundation of a strong trading position.":"is below the national average. Value credentials matter here — PMPs, price-marked promotions and a well-controlled cost structure are essential."}`,
        `The deprivation index of ${deprivation}/10 ${deprivation<=3?"indicates a high-deprivation catchment. This is not a barrier to a successful store — high-deprivation areas often have the strongest convenience retail penetration — but the range and pricing strategy need to reflect the economic reality of the customer base.":deprivation<=6?"indicates moderate deprivation. The store needs to cover value without sacrificing the range quality that brings in the broader catchment.":"indicates a relatively low-deprivation catchment, which gives the operator more flexibility on ranging and pricing strategy."}`
      ].join(" "),

      pl: [
        `The profit and loss account is built on post-refit annual revenue of ${fmt(C.upliftedAnn)}, with a cost of goods of ${fmt(Math.round(C.upliftedAnn*(1-C.blGP/100)))} — leaving a gross profit of ${fmt(C.annGP)} at ${pct(C.blGP)} margin.`,
        `Total operating costs — rent, rates, staff, utilities and other costs — come to ${fmt(C.annC)}, representing ${pct(totalCostRatio)} of sales. ${totalCostRatio>75?"This is high. The business is generating sufficient gross profit to cover these costs and service the loan, but the headroom is limited. Any underperformance on sales or an unexpected cost increase — a rates revaluation, a rent review, an equipment failure — would have a disproportionate impact on the bottom line. The operator should stress-test the cost base carefully before proceeding.":totalCostRatio>65?"This is within the expected range for a convenience store of this type, but the operator should be conscious that there is not a great deal of room to absorb cost shocks. Tightly managed operations with a focus on rota efficiency and energy costs will be important.":"This is well-controlled and leaves healthy headroom for profit delivery. The business can absorb a reasonable degree of cost variation without dropping below viability."}`,
        `Staff costs at ${pct(staffRatio)} of sales ${staffRatio>12?"are above the 9–12% sector norm. This should be reviewed — either the staffing model has been set above what the projected turnover justifies, or the store relies heavily on higher-cost staff. Both are worth addressing before the refit completes.":staffRatio<9?"are lean. This is achievable in a well-run owner-operated store, but the operator should be confident the store can be covered safely and compliantly at this level.":"are within the 9–12% sector norm and do not raise any concerns."}`,
        `EBITDA — the trading profit before finance — is ${fmt(C.eb)}, representing ${pct(ebitdaMargin)} of sales. ${ebitdaMargin>=12?"This is a strong EBITDA margin for a convenience store and gives the business a solid platform to service the finance and still deliver meaningful net profit.":ebitdaMargin>=8?"This is at the lower end of what Genesis Retail would consider healthy — sufficient to service the loan comfortably, but without significant surplus.":ebitdaMargin>=5?"EBITDA at this level covers the finance charge but leaves limited buffer. The business needs to trade to plan; there is not much room for error.":"EBITDA is below the 8% minimum threshold Genesis Retail applies to viable convenience retail investments. The cost base or the trading projections — or both — need to be reviewed before this assessment can support a lending application."}`
      ].join(" "),

      fiveYear: [
        `The five-year forecast applies 3% annual sales growth to the post-refit Year 1 base, with operating costs inflating at 2% per year. These are deliberately conservative assumptions — 3% growth in a well-run convenience store in an established residential catchment is achievable without any step change in the business.`,
        `By Year 5, the store is forecast to generate annual sales of ${fmt(yr5[4]?.s||0)} and a net profit of ${fmt(yr5[4]?.np||0)}. Cumulative net profit across the five-year period is ${fmt(cumNp(5))}.`,
        financeYears<=5
          ? `The loan facility is fully repaid within the forecast period. From Year ${financeYears+1} onwards the finance charge drops away, which will materially improve the net profit position. This is a significant positive for the medium-term cash generation of the business.`
          : `The finance facility runs beyond the five-year forecast window. The loan repayment of ${fmt(Math.round(C.mp))}/month remains a constant cost throughout the period modelled — cash generation in the later years will be constrained accordingly.`,
        cumNp(5)>0
          ? `A cumulative return of ${fmt(cumNp(5))} against an initial investment of ${fmt(C.ti)} represents a strong five-year position. The business more than recovers the investment within the forecast period, which is the primary test a lender will apply to this projection.`
          : `The cumulative position over five years is negative, which means the investment does not recover within the modelled window on current assumptions. This does not necessarily mean the opportunity is unviable — the sensitivity of these projections to relatively small improvements in turnover or cost is significant — but it is a finding that lenders will scrutinise closely. The operator should be prepared to explain the basis for the uplift assumptions in detail.`
      ].join(" "),

      sensitivity: [
        `The table models the impact on return on investment of footfall varying between -20% and +20% of the base case, and rent varying by the same range. The base case sits in the centre cell.`,
        sensitivityData[2][2]?.roi>=20
          ? `The base case delivers a ${sensitivityData[2][2].roi.toFixed(1)}% ROI — above the 20% Genesis Retail threshold. The investment case is sound on the central assumptions.`
          : `The base case delivers a ${sensitivityData[2][2]?.roi.toFixed(1)}% ROI, which is below the 20% Genesis Retail threshold. The investment is viable but does not meet the target return on the central assumptions — the operator and any financier should understand the basis for the projections carefully.`,
        sensitivityData[0]?.[0]?.roi>=10
          ? `Even in the most adverse scenario modelled — footfall 20% below forecast and rent 20% above — the store still returns ${sensitivityData[0][0].roi.toFixed(1)}% ROI. This is a resilient investment with meaningful downside protection.`
          : `In the most adverse scenario modelled, the store drops to ${sensitivityData[0]?.[0]?.roi.toFixed(1)||0}% ROI. This limited downside protection means the investment is sensitive to trading performance — the operator needs to be confident in the footfall projections, and the rent negotiation should prioritise locking in a level that keeps the base case well clear of the break-even line.`,
        `${sensitivityData.flat().filter(c=>c.roi>=20).length} of the 25 scenarios modelled produce a return of 20% or above. ${sensitivityData.flat().filter(c=>c.roi>=20).length>=20?"The investment is robust across the vast majority of scenarios. A lender reviewing this table should be comfortable with the risk profile.":sensitivityData.flat().filter(c=>c.roi>=20).length>=12?"The investment meets the target return across the majority of scenarios. It is sensitive to a combination of footfall underperformance and cost pressure, but is not fragile.":"The investment only meets the target return in a minority of scenarios. This should be discussed openly with any financier — the projections need to be stress-tested and the key assumptions clearly documented."}`
      ].join(" "),

    };
  },[C,cats,uplift,rent,rates,staffPct,utilities,otherCosts,risks,competitorList,nearestComp,planningApps,footfall,avgBasket,catchmentPop,medianIncome,deprivation,ageBands,employment,housing,spendBands,missions,fhour,financeYears,yr5,sensitivityData,DS]);


  // ── Max affordable rent (Lease Calculator) ──────────────────────────────────
  const [targetRoi, setTargetRoi] = useState(15);
  const maxRent = useMemo(()=>{
    const wk2  = footfall*7*avgBasket*(1+uplift/100);
    const ann2 = wk2*52;
    const gp2  = ann2*(C.blGP/100);
    const stf2 = ann2*(staffPct/100);
    // net = gp - (rent + rates + stf + utils + other) - finance = targetRoi/100 * ti
    // rent = gp - rates - stf - utils - other - finance - targetRoi*ti/100
    const maxR = gp2 - rates - stf2 - utilities - otherCosts - C.af - (targetRoi/100)*C.ti;
    return Math.max(0, maxR);
  },[footfall,avgBasket,uplift,C,staffPct,rates,utilities,otherCosts,targetRoi]);

  const rentSensitivity = useMemo(()=>{
    return [5,10,15,18,20,25,30].map(tgt=>{
      const wk2  = footfall*7*avgBasket*(1+uplift/100);
      const ann2 = wk2*52;
      const gp2  = ann2*(C.blGP/100);
      const stf2 = ann2*(staffPct/100);
      const maxR = gp2 - rates - stf2 - utilities - otherCosts - C.af - (tgt/100)*C.ti;
      return {tgt, maxR:Math.max(0,maxR)};
    });
  },[footfall,avgBasket,uplift,C,staffPct,rates,utilities,otherCosts]);

  const generatePDF = async () => {
    if(!pdfRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm"),
        import("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm"),
      ]);
      const canvas = await html2canvas(pdfRef.current, {
        scale: 3, useCORS: true, backgroundColor: "#ffffff",
        logging: false, windowWidth: 794, // A4 width in px at 96dpi
        imageTimeout: 0, allowTaint: false,
      });
      const imgData = canvas.toDataURL("image/png"); // PNG = lossless, sharp text
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pageW) / canvas.width;
      let yOffset = 0, remaining = imgH;
      while(remaining > 0) {
        if(yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yOffset, pageW, imgH, undefined, "FAST");
        yOffset += pageH; remaining -= pageH;
      }
      const filename = (propName||"assessment").replace(/[^a-z0-9]/gi,"_").toLowerCase()+"_genesis_retail_report.pdf";
      pdf.save(filename);
    } catch(e) {
      alert("PDF generation failed: "+e.message);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <ErrorBoundary>
    <div style={{fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",background:G.bg,minHeight:"100vh",color:G.text}}>
      <style>{`
        *{box-sizing:border-box;margin:0}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input:focus,select:focus,textarea:focus{outline:none;box-shadow:0 0 0 3px rgba(0,0,0,0.08)}
        select option{background:#fff;color:#0c1024}
        textarea{resize:vertical}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:#c8cfe8;border-radius:3px}
        @media print{
          .no-print{display:none!important}
          body,html{background:#fff!important;margin:0;padding:0}
          main{padding:0!important;max-width:100%!important}
          .page-break{page-break-before:always;padding-top:24px}
          .avoid-break{page-break-inside:avoid}
          nav,header,.nav-inner{display:none!important}
          #root>div>div:first-child{display:none!important}
          .pdf-wrapper{padding:0!important;margin:0!important}
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}
          body{font-size:11pt}
          h1,h2,h3{page-break-after:avoid}
          table{page-break-inside:avoid}
          img{max-width:100%!important}
        }
        @media print{.pdf-footer{display:block!important}}
        .pdf-footer{display:none;position:fixed;bottom:0;left:0;right:0;background:#1e3a8a;padding:8px 24px;display:flex;justify-content:space-between;align-items:center;z-index:9999;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .pdf-watermark{pointer-events:none;position:absolute;inset:0;z-index:0;overflow:hidden;}
        .pdf-watermark svg{position:absolute;inset:0;width:100%;height:100%;}
        .pdf-wrapper{position:relative;}
      `}</style>
      {/* Load SheetJS for Excel export */}
      {!window.XLSX&&(()=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";document.head.appendChild(s);return null;})()}

      {/* ── Share modal ── */}
      {showShare&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#fff",borderRadius:16,padding:24,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <div style={{fontSize:18,fontWeight:800,color:"#FFFFFF",marginBottom:6}}>🔒 Share Locked Report</div>
            <div style={{fontSize:13,color:G.text,marginBottom:16,lineHeight:1.7}}>
              Generate a share token for this assessment. Recipients see all results but cannot edit fields or reverse-engineer the model. Set a PIN they'll need to unlock it.
            </div>
            {!sharePayload ? (
              <>
                <Fld l="Set a 4–8 digit PIN" h="Tell your client this PIN separately — don't include it in the message" ch={
                  <input style={INP_manual} type="password" value={sharePin} onChange={e=>setSharePin(e.target.value.replace(/\D/g,"").slice(0,8))} placeholder="e.g. 2468"/>
                }/>
                <div style={{display:"flex",gap:10,marginTop:8}}>
                  <button onClick={()=>setShowShare(false)} style={{flex:1,padding:12,background:G.bg,border:"1.5px solid "+G.border,borderRadius:8,color:G.light,cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:600}}>Cancel</button>
                  <button onClick={()=>{if(sharePin.length>=4){setSharePayload(generateShareURL());}}} disabled={sharePin.length<4} style={{flex:2,padding:12,background:sharePin.length>=4?G.mid:"#aaa",border:"none",borderRadius:8,color:"#fff",cursor:sharePin.length>=4?"pointer":"default",fontFamily:"inherit",fontSize:14,fontWeight:700}}>Generate Share Token</button>
                </div>
              </>
            ):(
              <>
                <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:8}}>✓ Share token generated</div>
                <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:8,padding:12,marginBottom:12,fontSize:11,wordBreak:"break-all",color:G.text,lineHeight:1.6,maxHeight:120,overflowY:"auto"}}>{sharePayload}</div>
                <div style={{fontSize:12,color:"#FFFFFF",marginBottom:12,lineHeight:1.6}}>⚠ Send this token via email or WhatsApp. Tell the client their PIN separately. The token expires when you close this window.</div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>{navigator.clipboard?.writeText(sharePayload);setSaveMsg("Token copied!");setTimeout(()=>setSaveMsg(""),2000);}} style={{flex:2,padding:12,background:G.mid,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>📋 Copy Token</button>
                  <button onClick={()=>{setShowShare(false);setSharePayload(null);setSharePin("");}} style={{flex:1,padding:12,background:G.bg,border:"1.5px solid "+G.border,borderRadius:8,color:G.light,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Close</button>
                </div>
              </>
            )}
            <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid "+G.border}}>
              <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:8}}>Load a shared token</div>
              <Fld l="Paste token" ch={<textarea style={{...INP_manual,minHeight:60,fontSize:12}} value={loadToken} onChange={e=>setLoadToken(e.target.value.trim())} placeholder="Paste GENESIS-SHARE::... token here"/>}/>
              <Fld l="Enter PIN" ch={<input style={INP_manual} type="password" value={loadPin} onChange={e=>setLoadPin(e.target.value)} placeholder="PIN"/>}/>
              {loadError&&<div style={{color:"#d62828",fontSize:13,marginBottom:8}}>{loadError}</div>}
              <button onClick={()=>{
                const decoded = decodeShareToken(loadToken, loadPin);
                if(decoded){ loadAssessment(decoded); setShowShare(false); setLoadToken(""); setLoadPin(""); setLoadError(""); }
                else setLoadError("Invalid token or wrong PIN. Please try again.");
              }} style={{width:"100%",padding:12,background:G.orange,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}>Unlock & Load Assessment</button>
            </div>
          </div>
        </div>
      )}

      {/* Header nav */}
      <div className="no-print" style={{background:"#0B1418",padding:"16px 16px 0",position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(6,14,36,0.6)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <img src="https://genesis-retail-website.vercel.app/logo.jpg" alt="Genesis Retail" style={{height:44,width:"auto",objectFit:"contain",borderRadius:4}}/>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:G.val,letterSpacing:".04em"}}>Site Viability Assessor</div>
              {propName&&<div style={{fontSize:12,color:"#FFFFFF",marginTop:1}}>{propName}{postcode?" · "+postcode:""}</div>}
            </div>
          </div>
          <div style={{display:"flex",gap:6,flexShrink:0,marginTop:4}}>
            <button onClick={saveAssessment} style={{padding:"7px 12px",background:"rgba(212,160,23,0.15)",border:"1.5px solid #2d55c8",borderRadius:7,color:G.val,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
              {saveMsg||"💾 Save"}
            </button>
            <button onClick={()=>setShowShare(true)} style={{padding:"7px 12px",background:"rgba(212,160,23,0.15)",border:"1.5px solid #2d55c8",borderRadius:7,color:G.val,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700}}>
              🔒 Share
            </button>
            <button onClick={()=>setStep(10)} title="Admin" style={{padding:"7px 10px",background:"transparent",border:"none",color:G.val,cursor:"pointer",fontSize:16,opacity:0.4}} title="Admin">⚙</button>
            {lastSaved?<div style={{fontSize:10,color:"#22C55E",alignSelf:"center",flexShrink:0}}>✓ {lastSaved}</div>:<div style={{fontSize:10,color:"#EF4444",alignSelf:"center",flexShrink:0}}>"Saving..."</div>}
          </div>
        </div>
        <div style={{display:"flex",gap:2,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
          {STEPS.map((s,i)=>(
            i===10 ? null :
            <button key={i} onClick={()=>setStep(i)} style={{flexShrink:0,padding:"8px 12px",background:step===i?"#fff":step>i?"#2d55c8":"transparent",border:"1.5px solid "+(step===i?"#fff":step>i?"#2d55c8":"#5a6fa8"),color:step===i?G.text:"#fff",fontSize:12,borderRadius:"6px 6px 0 0",whiteSpace:"nowrap",cursor:"pointer",fontFamily:"inherit",fontWeight:step===i?700:400}}>
              {i+1}. {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"24px 16px 24px",maxWidth:700,margin:"0 auto"}}>

        {/* ── COVER ── */}
        {step===0&&(
          <div>
            <SH c="Cover Page"/>

            <Fld l="Site name / address" ch={<input style={INP_manual} value={propName} onChange={e=>setPropName(e.target.value)} placeholder="e.g. 5-6 Canterbury Parade, South Ockendon"/>}/>
            <Fld l="Client name" ch={<input style={INP_manual} value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Mr J Smith"/>}/>

            {/* Saved assessments */}
            {savedAssessments.length>0&&(
              <div style={{marginBottom:24}}>
                <Sub c="Saved Assessments — tap to reload"/>
                {savedAssessments.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:G.card,border:"1px solid "+G.border,borderRadius:10,marginBottom:8}}>
                    <div style={{flex:1,cursor:"pointer"}} onClick={()=>loadAssessment(a)}>
                      <div style={{fontSize:14,fontWeight:700,color:G.text}}>{a.propName||"Unnamed site"}</div>
                      <div style={{fontSize:12,color:G.val}}>{a.postcode||"No postcode"} · {a.location||""} · Saved {new Date(a.savedAt).toLocaleDateString("en-GB")} {new Date(a.savedAt).toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}</div>
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:G.text,cursor:"pointer"}} onClick={()=>loadAssessment(a)}>Load →</div>
                    <button onClick={e=>{
                      e.stopPropagation();
                      if(!window.confirm("Delete this assessment?")) return;
                      const updated = savedAssessments.filter((_,j)=>j!==i);
                      localStorage.setItem("genesis_assessments", JSON.stringify(updated));
                      setSavedAssessments(updated);
                    }} style={{background:"transparent",border:"1px solid #d62828",borderRadius:6,color:"#d62828",cursor:"pointer",fontFamily:"inherit",fontSize:12,padding:"4px 8px",flexShrink:0}}>✕</button>
                  </div>
                ))}
                <button onClick={()=>{if(window.confirm("Clear all saved assessments?")) {localStorage.removeItem("genesis_assessments");setSavedAssessments([]);}}} style={{fontSize:12,color:"#d62828",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",padding:"4px 0"}}>Clear all saved assessments</button>
              </div>
            )}
            {/* Site Visit Evidence */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:13,fontWeight:700,color:G.text,textTransform:"uppercase",letterSpacing:".08em",marginBottom:10}}>Site Visit Evidence</div>

              {storePhoto?(
                <div style={{position:"relative",marginBottom:12}}>
                  <img src={storePhoto} alt="Store" style={{width:"100%",maxHeight:220,objectFit:"cover",borderRadius:8,border:"1px solid "+G.border,display:"block"}}/>
                  <button onClick={()=>setStorePhoto(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.7)",border:"none",borderRadius:4,padding:"4px 10px",fontSize:11,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>✕ Remove</button>
                </div>
              ):(
                <label style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:G.card,border:"1.5px dashed "+G.border,borderRadius:8,cursor:"pointer",marginBottom:12}}>
                  <span style={{fontSize:24}}>📷</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:G.text}}>Add site photo</div>
                    <div style={{fontSize:11,color:G.light}}>JPG or PNG — appears in final PDF report</div>
                  </div>
                  <input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}}/>
                </label>
              )}

              {/* Site Visit Review Panel */}
              <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:8,padding:"14px 16px",marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:G.orange,textTransform:"uppercase",letterSpacing:".12em",marginBottom:12}}>Site Visit Assessment</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {[
                    {k:"visibility",l:"Visibility from road"},
                    {k:"access",l:"Customer access"},
                    {k:"parking",l:"Parking"},
                    {k:"fascia",l:"Fascia / signage"},
                    {k:"competition",l:"Competition nearby"},
                  ].map(({k,l})=>(
                    <div key={k}>
                      <div style={{fontSize:9,fontWeight:700,color:G.light,textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>{l}</div>
                      <select value={siteVisit[k]||""} onChange={e=>setSiteVisit(v=>({...v,[k]:e.target.value}))}
                        style={{...INP_manual,padding:"6px 8px",fontSize:12}}>
                        <option value="">— select —</option>
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Average">Average</option>
                        <option value="Poor">Poor</option>
                        <option value="N/A">N/A</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10}}>
                  <div style={{fontSize:9,fontWeight:700,color:"#22C55E",textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>Site Strengths</div>
                  <input value={siteVisit.strengths||""} onChange={e=>setSiteVisit(v=>({...v,strengths:e.target.value}))}
                    placeholder="e.g. corner position, high pedestrian flow, strong parking..."
                    style={{...INP_manual,padding:"7px 10px",fontSize:12}}/>
                </div>
                <div style={{marginTop:8}}>
                  <div style={{fontSize:9,fontWeight:700,color:"#EF4444",textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>Site Weaknesses</div>
                  <input value={siteVisit.weaknesses||""} onChange={e=>setSiteVisit(v=>({...v,weaknesses:e.target.value}))}
                    placeholder="e.g. restricted access, limited parking, heavy competition..."
                    style={{...INP_manual,padding:"7px 10px",fontSize:12}}/>
                </div>
              </div>
            </div>

            {/* Annotated photos */}
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:700,color:G.text,textTransform:"uppercase",letterSpacing:".08em",marginBottom:8}}>Visit Photos (annotated)</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                {photos.map((ph,i)=>(
                  <div key={i} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,overflow:"hidden"}}>
                    <img src={ph.src} alt="Visit" style={{width:"100%",aspectRatio:"1/1",objectFit:"cover",display:"block"}}/>
                    <div style={{padding:8}}>
                      <select value={ph.tag} onChange={e=>setPhotos(p=>p.map((x,j)=>j===i?{...x,tag:e.target.value}:x))} style={{...INP_manual,fontSize:12,padding:"6px 8px",marginBottom:6}}>
                        {["exterior","interior","chillers","signage","competitor","other"].map(t=><option key={t}>{t}</option>)}
                      </select>
                      <input value={ph.caption} onChange={e=>setPhotos(p=>p.map((x,j)=>j===i?{...x,caption:e.target.value}:x))} placeholder="Caption..." style={{...INP_manual,fontSize:12,padding:"6px 8px"}}/>
                    </div>
                    <button onClick={()=>setPhotos(p=>p.filter((_,j)=>j!==i))} style={{width:"100%",padding:6,background:"#fde8e8",border:"none",color:"#d62828",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Remove</button>
                  </div>
                ))}
              </div>
              <label style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:G.card,border:"1.5px dashed "+G.border,borderRadius:10,cursor:"pointer"}}>
                <span style={{fontSize:20}}>📸</span>
                <span style={{fontSize:14,color:G.val,fontWeight:600}}>Add visit photos</span>
                <input type="file" accept="image/*" multiple onChange={handleAnnotatedPhoto} style={{display:"none"}}/>
              </label>
            </div>

            <Fld l="About the Store" ch={<textarea value={storeNote} onChange={e=>setStoreNote(e.target.value)} onBlur={saveAssessment} placeholder="Describe the store, location, format, key features..." style={{...INP_manual,minHeight:120,lineHeight:1.7,fontSize:15}}/>}/>
            <Fld l="About Me and Genesis Retail" ch={<textarea value={genesisNote} onChange={e=>setGenesisNote(e.target.value)} onBlur={saveAssessment} placeholder="Introduce yourself and Genesis Retail..." style={{...INP_manual,minHeight:120,lineHeight:1.7,fontSize:15}}/>}/>
          </div>
        )}

        {/* ── PROPERTY ── */}
        {step===1&&(
          <div>
            <SH c="Property Details"/>
            <Legend/>

            {/* Postcode lookup */}
            <div style={{background:"#1E293B",border:"1.5px solid "+G.mid,borderRadius:12,padding:16,marginBottom:20}}>
              <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:8}}>✦ Auto-populate from postcode</div>
              <div style={{fontSize:13,color:G.text,marginBottom:12,lineHeight:1.6}}>Enter the site postcode to automatically pull: competitor data, local demographics, VOA rates estimate, planning applications, and more.</div>
              <div style={{display:"flex",gap:10}}>
                <input
                  style={{...INP_manual,flex:1,textTransform:"uppercase"}}
                  value={postcode}
                  onChange={e=>setPostcode(e.target.value.toUpperCase())}
                  placeholder="e.g. SW1A 1AA"
                  onKeyDown={e=>e.key==="Enter"&&doPostcodeLookup(postcode)}
                />
                <button
                  onClick={()=>doPostcodeLookup(postcode)}
                  disabled={postcodeLoading}
                  style={{padding:"12px 20px",background:postcodeLoading?G.pale:G.text,border:"none",borderRadius:8,color:postcodeLoading?G.text:"#fff",cursor:postcodeLoading?"default":"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700,flexShrink:0,minWidth:90}}
                >
                  {postcodeLoading ? <span style={{display:"inline-block",animation:"spin 1s linear infinite"}}>⟳</span> : "Look up"}
                </button>
              </div>
              {postcodeError&&<div style={{marginTop:8,fontSize:13,color:"#d62828",fontWeight:600}}>⚠ {postcodeError}</div>}
              {postcodeData&&!postcodeLoading&&(
                <div style={{marginTop:12,padding:"10px 14px",background:"#fff",borderRadius:8,border:"1px solid "+G.border}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:6}}>✓ Postcode found — data auto-populated</div>
                  <div style={{fontSize:12,color:G.text}}>District: {postcodeData.admin_district} · Region: {postcodeData.region}</div>
                  {competitorList.length>0&&<div style={{fontSize:12,color:G.text,marginTop:3}}>{competitorList.length} nearby competitors found on map</div>}
                  {planningApps.length>0&&<div style={{fontSize:12,color:planningApps.some(p=>p.risk==="high")?"#d62828":G.orange,marginTop:3,fontWeight:600}}>{planningApps.length} retail planning application(s) detected nearby</div>}
                  {postcodeData.admin_district&&(
                    <div style={{marginTop:10,display:"flex",gap:8,flexWrap:"wrap"}}>
                      <a
                        href={`https://www.planning.data.gov.uk/map/?postcode=${encodeURIComponent(postcode.trim())}&dataset=planning-application`}
                        target="_blank" rel="noopener noreferrer"
                        style={{flex:1,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 14px",background:G.mid,color:"#fff",borderRadius:7,fontSize:13,fontWeight:700,textDecoration:"none"}}
                      >
                        Gov.uk planning map →
                      </a>
                      <a
                        href={`https://searchplan.co.uk/?postcode=${encodeURIComponent(postcode.trim())}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{flex:1,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 14px",background:G.card,border:"1px solid "+G.border,borderRadius:7,color:G.val,fontSize:13,fontWeight:600,textDecoration:"none"}}
                      >
                        Local council portal →
                      </a>
                    </div>
                  )}

                  {/* Postcode commentary box */}
                  <div style={{marginTop:14,borderTop:"1px solid "+G.border,paddingTop:12}}>
                    <div style={{fontSize:11,fontWeight:700,color:G.text,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Postcode Notes</div>
                    <div style={{fontSize:11,color:"#FFFFFF",marginBottom:6}}>Record your observations about this location — what you noticed on the visit, the feel of the area, footfall patterns, anything relevant.</div>
                    <textarea
                      value={postcodeNotes}
                      onChange={e=>setPostcodeNotes(e.target.value)}
                      onBlur={saveAssessment}
                      placeholder="e.g. High footfall residential estate, strong commuter flow in mornings. Large Tesco 0.3 miles away but no direct convenience competition on the parade. Good parking, well-maintained environment. Local demographic appears family-oriented with a mix of ages..."
                      style={{...INP_manual,minHeight:100,lineHeight:1.7,fontSize:13,width:"100%"}}
                    />
                  </div>
                </div>
              )}
            </div>

            <Row2 ch={[
              <Fld key="a" l="Net selling area (sq ft)" h="Ask the landlord or agent" ch={<input style={INP_manual} type="number" value={sqft} onFocus={e=>e.target.select()} onChange={e=>setSqft(e.target.value===""?0:+e.target.value)} onBlur={saveAssessment}/>}/>,
              <Fld key="b" l="Trading hours / day" h="Your assessment on the visit" ch={<input style={INP_manual} type="number" value={openHours} onFocus={e=>e.target.select()} onChange={e=>setOpenHours(e.target.value===""?0:+e.target.value)}/>}/>,
            ]}/>
            <Fld l="Location type" h="Auto-populates sector averages" ch={
              <select style={INP_manual} value={location} onChange={e=>setLocation(e.target.value)}>
                <option value="city-centre">City centre / transport hub</option>
                <option value="suburban">Suburban / residential estate</option>
                <option value="village">Village / rural</option>
                <option value="parade">Retail parade</option>
                <option value="forecourt">Forecourt</option>
              </select>
            }/>
            <Row2 ch={[
              <Fld key="c" l="Est. daily transactions" h="Sector average — override if needed" ch={<input style={INP_auto} type="number" value={footfall} onFocus={e=>e.target.select()} onChange={e=>setFootfall(e.target.value===""?0:+e.target.value)}/>}/>,
              <Fld key="d" l="Average basket (£)" h="Sector average — override if needed" ch={<input style={INP_auto} type="number" step="0.50" value={avgBasket} onFocus={e=>e.target.select()} onChange={e=>setAvgBasket(e.target.value===""?0:+e.target.value)}/>}/>,
            ]}/>
            <Fld l="Post-refit uplift (%)" h="Expected uplift after new symbol group and refit (sector average 10-25%)" ch={<input style={INP_manual} type="number" step="1" min="0" max="50" value={uplift} onFocus={e=>e.target.select()} onChange={e=>setUplift(e.target.value===""?0:+e.target.value)} onBlur={saveAssessment}/>}/>
            <S3 items={[{l:"Weekly turnover (base)",v:fmt(C.wk)},{l:"Post-refit weekly",v:fmt(C.upliftedWk),hi:true},{l:"Sales/sqft/wk",v:"£"+(C.upliftedSpf||0).toFixed(2),hi:true}]}/>
          </div>
        )}

        {/* ── COSTS ── */}
        {step===2&&(
          <div>
            {/* Live financial summary strip */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16,padding:"12px 14px",background:G.card,borderRadius:8,border:"1px solid "+G.border}}>
              {[
                {l:"Projected Sales",v:fmt(C.ann)},
                {l:"EBITDA",v:fmt(C.ebitda),c:C.ebitda>0?G.pos:G.neg},
                {l:"Net Profit",v:fmt(C.np),c:C.np>0?G.pos:G.neg},
                {l:"ROI",v:pct(C.roi),c:C.roi>=20?G.pos:C.roi>=10?"#F59E0B":G.neg},
              ].map(({l,v,c})=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:G.light,fontWeight:600,marginBottom:3}}>{l}</div>
                  <div style={{fontSize:18,fontWeight:800,color:c||G.text,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>

            <SH c="Operating Costs"/>

            {postcodeData&&<div style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:6,padding:"8px 12px",marginBottom:12,fontSize:11,color:G.pos}}>✓ Business rates auto-estimated from VOA data for {postcode} — override with actual figure if known.</div>}

            {/* KEY DRIVER fields — 2 column grid */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>

              {/* Annual Rent — KEY DRIVER */}
              <div style={{borderLeft:"3px solid #F59E0B",background:G.card,borderRadius:"0 6px 6px 0",padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:G.text,letterSpacing:".1em",textTransform:"uppercase"}}>Annual Rent</div>
                  <span style={{fontSize:8,background:"rgba(245,158,11,0.2)",color:"#F59E0B",padding:"1px 6px",borderRadius:3,fontWeight:700,letterSpacing:".08em"}}>KEY DRIVER</span>
                </div>
                <input style={{...INP_manual,padding:"7px 10px",fontSize:16,fontWeight:700,background:"transparent",border:"1px solid "+G.border}} type="number" value={rent} onFocus={e=>e.target.select()} onChange={e=>setRent(e.target.value===""?0:+e.target.value)}/>
                <div style={{fontSize:10,color:G.light,marginTop:4}}>{C.ann>0?pct(rent/C.ann*100)+" of projected sales":""} · Ask landlord or agent</div>
              </div>

              {/* Business Rates — KEY DRIVER */}
              <div style={{borderLeft:"3px solid #F59E0B",background:G.card,borderRadius:"0 6px 6px 0",padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:G.text,letterSpacing:".1em",textTransform:"uppercase"}}>Business Rates</div>
                  <span style={{fontSize:8,background:postcodeData?"rgba(34,197,94,0.15)":"rgba(255,255,255,0.1)",color:postcodeData?G.pos:G.light,padding:"1px 6px",borderRadius:3,fontWeight:700,letterSpacing:".08em"}}>{postcodeData?"AUTO ESTIMATE":"KEY DRIVER"}</span>
                </div>
                <input style={{...INP_manual,padding:"7px 10px",fontSize:16,fontWeight:700,background:"transparent",border:"1px solid "+G.border}} type="number" value={rates} onFocus={e=>e.target.select()} onChange={e=>setRates(e.target.value===""?0:+e.target.value)}/>
                <div style={{fontSize:10,color:G.light,marginTop:4}}>{C.ann>0?pct(rates/C.ann*100)+" of projected sales":""} · {postcodeData?"VOA estimate — override if known":"Check VOA or ask agent"}</div>
              </div>

              {/* Staff Costs — KEY DRIVER */}
              <div style={{borderLeft:"3px solid #F59E0B",background:G.card,borderRadius:"0 6px 6px 0",padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:G.text,letterSpacing:".1em",textTransform:"uppercase"}}>Staff / Wages (% of sales)</div>
                  <span style={{fontSize:8,background:"rgba(199,208,213,0.15)",color:G.light,padding:"1px 6px",borderRadius:3,fontWeight:700,letterSpacing:".08em"}}>MODEL ASSUMPTION</span>
                </div>
                <input style={{...INP_manual,padding:"7px 10px",fontSize:16,fontWeight:700,background:"transparent",border:"1px solid "+G.border}} type="number" step="0.5" value={staffPct} onFocus={e=>e.target.select()} onChange={e=>setStaffPct(e.target.value===""?0:+e.target.value)}/>
                <div style={{fontSize:10,color:G.light,marginTop:4}}>{fmt(C.stf)} per year · {C.ann>0?pct(C.stf/C.ann*100)+" of turnover":""}</div>
              </div>

              {/* Utilities */}
              <div style={{borderLeft:"3px solid "+G.border,background:G.card,borderRadius:"0 6px 6px 0",padding:"10px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:G.text,letterSpacing:".1em",textTransform:"uppercase"}}>Utilities (£)</div>
                  <span style={{fontSize:8,background:"rgba(199,208,213,0.15)",color:G.light,padding:"1px 6px",borderRadius:3,fontWeight:700,letterSpacing:".08em"}}>MODEL ASSUMPTION</span>
                </div>
                <input style={{...INP_manual,padding:"7px 10px",fontSize:16,fontWeight:700,background:"transparent",border:"1px solid "+G.border}} type="number" value={utilities} onFocus={e=>e.target.select()} onChange={e=>setUtilities(e.target.value===""?0:+e.target.value)}/>
                <div style={{fontSize:10,color:G.light,marginTop:4}}>{C.ann>0?pct(utilities/C.ann*100)+" of projected sales":""} · Sector average</div>
              </div>

              {/* Other Costs */}
              <div style={{borderLeft:"3px solid "+G.border,background:G.card,borderRadius:"0 6px 6px 0",padding:"10px 14px",gridColumn:"1/-1"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{fontSize:10,fontWeight:700,color:G.text,letterSpacing:".1em",textTransform:"uppercase"}}>Other Costs (£)</div>
                  <span style={{fontSize:8,background:"rgba(199,208,213,0.15)",color:G.light,padding:"1px 6px",borderRadius:3,fontWeight:700,letterSpacing:".08em"}}>USER INPUT</span>
                </div>
                <input style={{...INP_manual,padding:"7px 10px",fontSize:16,fontWeight:700,background:"transparent",border:"1px solid "+G.border}} type="number" value={otherCosts} onFocus={e=>e.target.select()} onChange={e=>setOtherCosts(e.target.value===""?0:+e.target.value)}/>
                <div style={{fontSize:10,color:G.light,marginTop:4}}>{C.ann>0?pct(otherCosts/C.ann*100)+" of projected sales":""} · Insurance, sundries, waste etc.</div>
              </div>
            </div>

            {/* Cost summary row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"12px 14px",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:6}}>
              {[
                {l:"Total Annual Costs",v:fmt(C.annC),hi:true},
                {l:"Weekly Cost Burden",v:fmt(Math.round(C.annC/52))},
                {l:"Cost : Sales Ratio",v:pct(C.ann>0?C.annC/C.ann*100:0)},
              ].map(({l,v,hi})=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:9,letterSpacing:".1em",textTransform:"uppercase",color:G.light,fontWeight:600,marginBottom:2}}>{l}</div>
                  <div style={{fontSize:hi?20:16,fontWeight:hi?800:700,color:hi?G.text:G.light,fontFamily:"monospace"}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REFIT ── */}
        {step===3&&(
          <div>
            <SH c="Refit and Investment"/>
            <Legend/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:20}}>
              {REFITS.map(p=>(
                <button key={p.label} onClick={()=>{setRefitCost(p.value);setCustomRefit(false);}} style={{padding:"14px 12px",textAlign:"left",cursor:"pointer",background:refitCost===p.value&&!customRefit?G.pale:G.card,border:(refitCost===p.value&&!customRefit?"2px":"1px")+" solid "+(refitCost===p.value&&!customRefit?G.mid:G.border),borderRadius:10,fontFamily:"inherit"}}>
                  <div style={{fontSize:13,fontWeight:600,color:refitCost===p.value&&!customRefit?G.text:G.light,marginBottom:4}}>{p.label}</div>
                  <div style={{fontSize:20,fontWeight:700,color:"#FFFFFF",marginBottom:3}}>{fmt(p.value)}</div>
                  <div style={{fontSize:12,color:G.val,lineHeight:1.4}}>{p.desc}</div>
                </button>
              ))}
            </div>
            <Row2 ch={[
              <Fld key="a" l="Refit cost (£)" ch={<input style={INP_manual} type="number" value={refitCost} onFocus={e=>e.target.select()} onChange={e=>{setRefitCost(e.target.value===""?0:+e.target.value);setCustomRefit(true);}}/>}/>,
              <Fld key="b" l="Opening stock (£)" h="Typically £25,000-£50,000" ch={<input style={INP_manual} type="number" value={stockCost} onFocus={e=>e.target.select()} onChange={e=>setStockCost(e.target.value===""?0:+e.target.value)}/>}/>,
            ]}/>
            <Row2 ch={[
              <Fld key="c" l="Finance rate % APR" ch={<input style={INP_manual} type="number" step="0.5" value={financeRate} onFocus={e=>e.target.select()} onChange={e=>setFinanceRate(e.target.value===""?0:+e.target.value)}/>}/>,
              <Fld key="d" l="Finance term (years)" ch={<input style={INP_manual} type="number" min="1" max="10" value={financeYears} onFocus={e=>e.target.select()} onChange={e=>setFinanceYears(e.target.value===""?0:+e.target.value)}/>}/>,
            ]}/>
            <S3 items={[{l:"Total investment",v:fmt(C.ti),hi:true},{l:"Monthly payment",v:fmt(Math.round(C.mp))},{l:"Annual finance",v:fmt(Math.round(C.af))}]}/>

            <div style={{marginTop:20}}>
              <div style={{fontSize:13,fontWeight:700,color:G.text,textTransform:"uppercase",letterSpacing:".07em",marginBottom:8}}>Post-Refit Commentary</div>
              <div style={{fontSize:12,color:"#FFFFFF",marginBottom:8}}>Describe what will be achieved by the refit — new layout, symbol group changes, ranging improvements, customer experience upgrades and the expected impact on trade.</div>
              <textarea
                value={refitCommentary}
                onChange={e=>setRefitCommentary(e.target.value)}
                onBlur={saveAssessment}
                placeholder="e.g. The refit will deliver a full symbol group conversion to Nisa, introducing Co-op own brand across chilled, grocery and BWS. The shopfit will include new LED lighting, a 4-door chilled extension, hot beverages station and digital price ticketing. Customer flow will be redesigned to maximise impulse purchase opportunities. The new ranging plan introduces 320 new lines with a focus on fresh, food-to-go and premium. Expected uplift is 18% on base turnover within 12 months of trading..."
                style={{...INP_manual,minHeight:160,lineHeight:1.7,fontSize:14,width:"100%"}}
              />
            </div>
          </div>
        )}

        {/* ── CATEGORIES ── */}
        {step===4&&(
          <div>
            <SH c="Category Sales Mix"/>
            <Legend/>
            <div style={{padding:"12px 14px",borderRadius:8,marginBottom:16,background:totalMix===100?"#dde4f5":"#fff4ea",border:"1px solid "+(totalMix===100?"#2d55c8":G.orange),fontSize:14,color:totalMix===100?G.text:G.orange,fontWeight:600}}>
              {totalMix===100?"✓ Mix totals 100%":"Currently "+totalMix.toFixed(1)+"% — adjust to reach 100%"}
            </div>
            {/* Category cards */}
            {cats.map((cat,i)=>{
              const acsDefault = CATS0.find(c=>c.name===cat.name);
              const acsMix = acsDefault ? acsDefault.mix : null;
              const acsGp  = acsDefault ? acsDefault.gp  : null;
              const mixDiff = acsMix !== null ? cat.mix - acsMix : 0;
              const annSales = C.ann * cat.mix / 100;
              const annGP = annSales * cat.gp / 100;
              return (
                <div key={cat.name} style={{background:G.card,border:"1px solid "+G.border,borderRadius:12,padding:18,marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                    <div style={{fontSize:16,fontWeight:700,color:G.text}}>{cat.icon} {cat.name}</div>
                    <div style={{display:"flex",gap:20}}>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:10,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>Annual Sales</div>
                        <div style={{fontSize:15,fontWeight:700,color:G.text}}>{fmt(annSales)}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:10,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>Annual GP</div>
                        <div style={{fontSize:15,fontWeight:700,color:"#FFFFFF"}}>{fmt(annGP)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{height:5,background:G.pale,borderRadius:3,marginBottom:14}}>
                    <div style={{height:"100%",background:G.mid,borderRadius:3,width:Math.min(cat.mix/20*100,100)+"%"}}/>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                    <div style={{background:"#fff",border:"1px solid "+G.border,borderRadius:8,padding:"12px",textAlign:"center"}}>
                      <div style={{fontSize:10,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>ACS Benchmark</div>
                      <div style={{fontSize:22,fontWeight:800,color:"#FFFFFF"}}>{acsMix !== null ? acsMix+"%" : "—"}</div>
                      {acsMix !== null && Math.abs(mixDiff)>=0.5 && (
                        <div style={{fontSize:10,marginTop:4,fontWeight:700,color:mixDiff>0?"#ffffff":"#c05010"}}>
                          {mixDiff>0?"▲ ":"▼ "}{Math.abs(mixDiff).toFixed(1)}% vs ACS
                        </div>
                      )}
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:10,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>Your Mix %</div>
                      <input
                        style={{...INP_manual,padding:"12px 8px",textAlign:"center",fontSize:20,fontWeight:700,width:"100%"}}
                        type="number" step="0.1" min="0" max="100"
                        value={cat.mix}
                        onChange={e=>setCats(p=>p.map((c,j)=>j===i?{...c,mix:parseFloat(e.target.value)||0}:c))}
                      />
                    </div>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:10,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:6}}>GP % <span style={{fontWeight:400}}>(avg {acsGp}%)</span></div>
                      <input
                        style={{...INP_auto,padding:"12px 8px",textAlign:"center",fontSize:20,fontWeight:700,width:"100%"}}
                        type="number" step="0.5" min="0" max="100"
                        value={cat.gp}
                        onChange={e=>setCats(p=>p.map((c,j)=>j===i?{...c,gp:parseFloat(e.target.value)||0}:c))}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Totals card */}
            <div style={{background:G.pale,border:"2px solid "+G.mid,borderRadius:12,padding:18,marginBottom:16}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,textAlign:"center"}}>
                {[["Total Mix",totalMix.toFixed(1)+"%",Math.abs(totalMix-100)<0.1?G.mid:G.orange],
                  ["Blended GP",(C.blGP||0).toFixed(1)+"%","#ffffff"],
                  ["Total Sales",fmt(C.ann),G.dark],
                  ["Total GP",fmt(C.annGP),"#ffffff"]].map(([l,v,col])=>(
                  <div key={l}>
                    <div style={{fontSize:10,color:G.light,textTransform:"uppercase",letterSpacing:".07em",marginBottom:4}}>{l}</div>
                    <div style={{fontSize:18,fontWeight:800,color:col}}>{v}</div>
                  </div>
                ))}
              </div>
              {Math.abs(totalMix-100)>=0.1&&<div style={{textAlign:"center",fontSize:12,color:"#FFFFFF",marginTop:10,fontWeight:600}}>⚠ Mix is {totalMix.toFixed(1)}% — adjust to reach 100%</div>}
            </div>

                        {/* GP margin context */}
            <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:14,marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:700,color:"#FFFFFF",marginBottom:10}}>ACS 2025 Average GP Margins by Category</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
                {[
                  {cat:"Hot Food & Drinks",gp:55,note:"Highest margin"},
                  {cat:"Health & Beauty",  gp:38,note:"Premium lines key"},
                  {cat:"Fruit & Veg",      gp:35,note:"Drives fresh visits"},
                  {cat:"Confectionery",    gp:32,note:"Impulse staple"},
                  {cat:"Bread & Bakery",   gp:30,note:"Daily mission"},
                  {cat:"Snacks",           gp:30,note:"Impulse staple"},
                  {cat:"Frozen",           gp:29,note:"Growing category"},
                  {cat:"Soft Drinks",      gp:28,note:"High volume"},
                  {cat:"Chilled",          gp:27,note:"Space hungry"},
                  {cat:"Grocery",          gp:25,note:"Basket builder"},
                  {cat:"News & Mags",      gp:24,note:"Footfall driver"},
                  {cat:"Alcohol",          gp:22,note:"BWS focus"},
                  {cat:"Fresh Milk",       gp:18,note:"Traffic driver"},
                  {cat:"Tobacco & Vaping", gp:8, note:"Low margin, high traffic"},
                ].map(({cat,gp,note})=>(
                  <div key={cat} style={{padding:"6px 8px",background:gp>=35?"#eef1fb":gp>=25?G.card:"#f8f9fc",borderRadius:6,border:"1px solid "+G.border}}>
                    <div style={{fontSize:10,color:G.text,fontWeight:600,lineHeight:1.3}}>{cat}</div>
                    <div style={{fontSize:14,fontWeight:800,color:gp>=35?"#ffffff":gp>=25?G.light:G.light}}>{gp}%</div>
                    <div style={{fontSize:9,color:G.light}}>{note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── DEMOGRAPHICS ── */}
        {step===5&&(
          <div>
            <SH c="Catchment Demographics"/>
            <Legend/>
            {postcodeData&&<div style={{background:"#1E293B",border:"1px solid "+G.border,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:G.val}}>✓ Regional income and population estimates auto-filled from postcode data. Override with ONS census figures for greater accuracy.</div>}
            <Row2 ch={[
              <Fld key="a" l="Catchment population (1 mile)" h="ONS census or Google Maps" ch={<input style={postcodeData?INP_auto:INP_manual} type="number" value={catchmentPop} onFocus={e=>e.target.select()} onChange={e=>setCatchmentPop(e.target.value===""?0:+e.target.value)}/>}/>,
              <Fld key="b" l="Population density" ch={<select style={postcodeData?INP_auto:INP_manual} value={popDensity} onChange={e=>setPopDensity(e.target.value)}><option value="high">High - urban</option><option value="medium">Medium - suburban</option><option value="low">Low - rural</option></select>}/>,
            ]}/>
            <Row2 ch={[
              <Fld key="c" l="Median household income (£)" h="ONS data" ch={<input style={postcodeData?INP_auto:INP_manual} type="number" value={medianIncome} onFocus={e=>e.target.select()} onChange={e=>setMedianIncome(e.target.value===""?0:+e.target.value)}/>}/>,
              <Fld key="d" l="Avg household size" h="ONS census" ch={<input style={INP_manual} type="number" step="0.1" value={householdSz} onFocus={e=>e.target.select()} onChange={e=>setHouseholdSz(e.target.value===""?0:+e.target.value)}/>}/>,
            ]}/>
            <Fld l="Deprivation index (1=most deprived, 10=least)" h="gov.uk indices of deprivation" ch={<input style={INP_manual} type="number" min="1" max="10" value={deprivation} onFocus={e=>e.target.select()} onChange={e=>setDeprivation(e.target.value===""?0:+e.target.value)}/>}/>
            <DemoSec label="Age breakdown % — ONS census data" keys={AGE_BANDS} values={ageBands} setter={setAgeBands}/>
            <DemoSec label="Employment status % — ONS census data" keys={EMPLOYMENTS} values={employment} setter={setEmployment}/>
            <DemoSec label="Housing tenure % — ONS census data" keys={HOUSINGS} values={housing} setter={setHousing}/>
            {/* Annotated stats row */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:20,marginBottom:8}}>
              {/* Catchment Pop */}
              <div style={{background:G.card,border:"1.5px solid "+G.border,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
                <div style={{fontSize:11,color:G.light,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>Catchment Pop</div>
                <div style={{fontSize:16,fontWeight:700,color:G.text}}>{catchmentPop.toLocaleString()}</div>
              </div>

              {/* Penetration Rate - with annotation */}
              <div style={{background:"#1a2a20",border:"1.5px solid "+G.mid,borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
                <div style={{fontSize:11,color:G.light,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>Penetration Rate</div>
                <div style={{fontSize:16,fontWeight:700,color:"#FFFFFF",marginBottom:6}}>{pct(C.pen)}</div>
                {C.pen>=99&&<div style={{fontSize:10,color:G.val,background:"#fff3cd",border:"1px solid #b45309",borderRadius:4,padding:"4px 6px",marginBottom:6}}>⚠ Check catchment population on Demographics tab — this figure may reflect incomplete data.</div>}
                <div style={{fontSize:10,color:G.light,lineHeight:1.5,textAlign:"left",borderTop:"1px solid "+G.border,paddingTop:6}}>
                  <strong style={{color:G.light}}>What this means:</strong> The % of people within 1 mile who would shop here weekly. 
                  <br/><span style={{color:C.pen>=15?"#0d5e72":C.pen>=10?"#ffffff":"#c05010"}}>{C.pen>=20?"✓ Strong — well above the 15% target":C.pen>=15?"✓ Good — meets the 15% benchmark":C.pen>=10?"⚠ Below target — aim for 15%+ with good ranging":"✗ Low — consider whether catchment is large enough"}</span>
                  <br/><span style={{fontSize:9,color:G.light}}>Benchmark: 15–25% for a well-run convenience store</span>
                </div>
              </div>

              {/* Demographic Score - with annotation */}
              <div style={{background:DS>=6?"#eef1fb":DS>=4?G.card:"#fdf8ec",border:"1.5px solid "+(DS>=6?G.mid:DS>=4?G.border:G.orange),borderRadius:10,padding:"12px 10px",textAlign:"center"}}>
                <div style={{fontSize:11,color:G.light,textTransform:"uppercase",letterSpacing:".08em",marginBottom:5}}>Demographic Score</div>
                <div style={{fontSize:16,fontWeight:700,color:DS>=6?"#ffffff":DS>=4?G.light:G.orange,marginBottom:6}}>{DS}/9</div>
                <div style={{fontSize:10,color:G.light,lineHeight:1.5,textAlign:"left",borderTop:"1px solid "+G.border,paddingTop:6}}>
                  <strong style={{color:G.light}}>What this means:</strong> A composite score (out of 9) based on income, population size, density, deprivation and working-age proportion.
                  <br/><span style={{color:DS>=6?G.text:DS>=4?"#ffffff":"#c05010"}}>{DS>=7?"✓ Excellent catchment — high demand indicators":DS>=5?"✓ Good catchment — solid trading base":DS>=3?"⚠ Average — manageable but limited upside":"✗ Weak catchment — review assumptions carefully"}</span>
                  <br/><span style={{fontSize:9,color:G.light}}>6+ = strong · 4–5 = average · below 4 = weak</span>
                </div>
              </div>
            </div>

            {/* Deprivation Index annotation */}
            <div style={{marginTop:8,marginBottom:16,padding:"12px 16px",background:G.card,border:"1px solid "+G.border,borderRadius:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#FFFFFF",marginBottom:4}}>Deprivation Index: {deprivation}/10</div>
                  <div style={{fontSize:11,color:G.light,lineHeight:1.6}}>
                    <strong style={{color:G.text}}>What this means:</strong> Measures how deprived the area is. <strong>1 = most deprived, 10 = least deprived.</strong> Based on the government's Index of Multiple Deprivation (IMD) covering income, employment, health, education and crime.
                  </div>
                </div>
                <div style={{minWidth:200,flex:1}}>
                  <div style={{height:8,background:G.pale,borderRadius:4,marginBottom:6,position:"relative"}}>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",borderRadius:4,width:(deprivation/10*100)+"%",background:deprivation>=7?G.mid:deprivation>=5?G.orange:"#d62828"}}/>
                    <div style={{position:"absolute",top:-2,width:12,height:12,borderRadius:50,background:deprivation>=7?G.mid:deprivation>=5?G.orange:"#d62828",border:"2px solid #fff",left:"calc("+(deprivation/10*100)+"% - 6px)"}}/>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:G.light}}>
                    <span>1 Most deprived</span><span>10 Least deprived</span>
                  </div>
                  <div style={{marginTop:6,fontSize:11,fontWeight:600,color:deprivation>=7?G.text:deprivation>=5?G.orange:"#d62828"}}>
                    {deprivation>=8?"Premium catchment — full range appropriate, invest in quality and fresh":
                     deprivation>=6?"Mainstream catchment — balance quality with value, PMPs important":
                     deprivation>=4?"Value-led catchment — PMPs essential, strong BWS and tobacco":
                     "High deprivation — focus on value, everyday essentials and tobacco"}
                  </div>
                </div>
              </div>
            </div>

            {/* Food consumption profile */}
            {foodProfile&&(
              <div style={{marginTop:20}}>
                <Sub c="Local Food Consumption Profile — auto-generated from postcode"/>
                <div style={{background:G.card,border:"1.5px solid "+G.mid,borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{fontSize:13,color:G.text,lineHeight:1.8,marginBottom:10}}>{foodProfile.summary}</div>
                  <div style={{fontSize:12,fontWeight:700,color:"#FFFFFF",marginBottom:4}}>Key insight</div>
                  <div style={{fontSize:13,color:G.text,lineHeight:1.7,padding:"10px 14px",background:G.pale,borderRadius:8,borderLeft:"3px solid "+G.mid}}>{foodProfile.keyInsight}</div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
                  {(foodProfile.topFoods||[]).map((f,i)=>{
                    const above = f.index >= 100;
                    const diff = Math.abs(f.index - 100);
                    return (
                      <div key={i} style={{background:above?"#eef1fb":"#f8f9fc",border:"1px solid "+(above?G.mid:G.border),borderRadius:10,padding:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                          <div style={{fontSize:13,fontWeight:700,color:G.text}}>{f.category}</div>
                          <div style={{padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:800,background:above?G.mid:"#c05010",color:"#fff"}}>{f.index >= 100?"+":"-"}{diff}%</div>
                        </div>
                        <div style={{fontSize:11,color:"#FFFFFF",marginBottom:6,lineHeight:1.5}}>{f.insight}</div>
                        <div style={{fontSize:11,color:G.val,fontWeight:600,borderTop:"1px solid "+G.border,paddingTop:6}}>→ {f.action}</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                  <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:G.text,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Ethnic Food Preferences</div>
                    <div style={{fontSize:12,color:G.text,lineHeight:1.6}}>{foodProfile.ethnicFoodNote}</div>
                  </div>
                  <div style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:G.text,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>Health Trends</div>
                    <div style={{fontSize:12,color:G.text,lineHeight:1.6}}>{foodProfile.healthTrend}</div>
                  </div>
                </div>

                {foodProfile.avoidCategories&&foodProfile.avoidCategories.length>0&&(
                  <div style={{background:"#fdf8ec",border:"1px solid "+G.orange,borderRadius:10,padding:14}}>
                    <div style={{fontSize:11,fontWeight:700,color:G.orange,textTransform:"uppercase",letterSpacing:".08em",marginBottom:6}}>De-prioritise in ranging</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {foodProfile.avoidCategories.map((c,i)=>(
                        <div key={i} style={{padding:"4px 10px",background:"#fff",border:"1px solid "+G.orange,borderRadius:6,fontSize:12,color:G.val,fontWeight:600}}>{c}</div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{fontSize:11,color:"#FFFFFF",marginTop:8,fontStyle:"italic"}}>Based on ONS Family Food Survey regional data and local demographic indicators. Use as a ranging guide alongside your visit observations.</div>
              </div>
            )}
            {!foodProfile&&postcodeData&&(
              <div style={{marginTop:16,padding:"10px 14px",background:G.card,border:"1px solid "+G.border,borderRadius:8,fontSize:12,color:G.val}}>Food consumption profile generating... (enter postcode on Property tab first)</div>
            )}
          </div>
        )}

        {/* ── SPEND ── */}
        {step===6&&(
          <div>
            <SH c="Spend Profile"/>
            <Legend/>
            <Sub c="Basket size distribution (%)"/>
            {SBANDS.map(b=>(
              <div key={b.key} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:14,color:G.text}}><span>{b.label}</span><span style={{fontWeight:700,color:"#FFFFFF"}}>{spendBands[b.key]}%</span></div>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <div style={{flex:1,height:8,background:G.pale,borderRadius:4}}><div style={{height:"100%",background:G.mid,borderRadius:4,width:spendBands[b.key]+"%"}}/></div>
                  <input style={{...INP_auto,width:70,padding:"8px 10px",textAlign:"center"}} type="number" step="1" value={spendBands[b.key]} onFocus={e=>e.target.select()} onChange={e=>setSpendBands(p=>({...p,[b.key]:e.target.value===""?0:+e.target.value}))}/>
                </div>
              </div>
            ))}
            <Row2 ch={[
              <Fld key="a" l="Peak trading day" ch={<select style={INP_manual} value={peakDay} onChange={e=>setPeakDay(e.target.value)}>{["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d=><option key={d}>{d}</option>)}</select>}/>,
              <Fld key="b" l="Peak trading hour" ch={<select style={INP_manual} value={peakHour} onChange={e=>setPeakHour(e.target.value)}>{FHOURS.map(h=><option key={h}>{h}</option>)}</select>}/>,
            ]}/>
            <Sub c="Trade peaks"/>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              {[["Morning commute",morningTrade,setMorningTrade],["Lunch trade",lunchTrade,setLunchTrade],["Evening / teatime",eveningTrade,setEveningTrade]].map(([l,v,s])=>(
                <button key={l} onClick={()=>s(x=>!x)} style={{padding:"10px 16px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",fontSize:14,border:"1.5px solid "+(v?G.text:G.border),background:v?G.pale:G.bg,color:v?G.text:G.light,fontWeight:v?700:400}}>{v?"✓ ":""}{l}</button>
              ))}
            </div>
            <Sub c="Shopping mission mix %"/>
            {MISSIONS.map(k=>(
              <div key={k} style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{fontSize:14,color:G.text,flex:1}}>{k}</div>
                <div style={{width:80,height:8,background:G.pale,borderRadius:4}}><div style={{height:"100%",background:G.light,borderRadius:4,width:missions[k]+"%"}}/></div>
                <input style={{...INP_auto,width:64,padding:"8px 10px",textAlign:"center"}} type="number" value={missions[k]} onFocus={e=>e.target.select()} onChange={e=>setMissions(p=>({...p,[k]:e.target.value===""?0:+e.target.value}))}/>
              </div>
            ))}
          </div>
        )}

        {/* ── TRAFFIC ── */}
        {step===7&&(
          <div>
            <SH c="Traffic and Area"/>
            <Legend/>

            {/* Competitor Map */}
            {mapLat && (
              <div style={{marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <Sub c="Competitor Map — auto-generated from postcode"/>
                  <button onClick={()=>fetchCompetitors(mapLat,mapLng,postcode)} style={{padding:"6px 12px",background:G.mid,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:600}}>↻ Refresh Competitors</button>
                </div>
                <CompetitorMap lat={mapLat} lng={mapLng} competitors={competitorList} existingStore={existingStore} comparables={comparables}/>
                {competitorList.length>0&&(
                  <div style={{marginTop:12}}>
                    {competitorList.slice(0,8).map((c,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"1px solid "+G.border}}>
                        <div style={{width:22,height:22,borderRadius:50,background:c.threat==="high"?"#d62828":c.threat==="medium"?G.orange:G.mid,color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:G.text}}>{c.name}</div><div style={{fontSize:11,color:G.light}}>{c.type}</div></div>
                        <div style={{fontSize:12,fontWeight:700,color:c.threat==="high"?"#d62828":c.threat==="medium"?G.orange:G.mid}}>{c.distance}</div>
                        <button onClick={()=>setCompetitorList(p=>p.filter((_,j)=>j!==i))} style={{background:"transparent",border:"none",color:G.light,cursor:"pointer",fontSize:16,padding:"0 4px"}}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Manual competitor add */}
                <div style={{marginTop:12,padding:"14px 16px",background:G.pale,border:"1px solid "+G.border,borderRadius:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:"#FFFFFF",marginBottom:10}}>Add competitor manually</div>
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr",gap:8,alignItems:"end"}}>
                    <input id="mc-name" style={{...INP_manual,fontSize:13}} placeholder="Store name e.g. Nisa, Derwent Parade"/>
                    <input id="mc-type" style={{...INP_manual,fontSize:13}} placeholder="Type e.g. Nisa"/>
                    <input id="mc-dist" style={{...INP_manual,fontSize:13}} placeholder="Distance e.g. 0.6"/>
                    <select id="mc-threat" style={{...INP_manual,fontSize:13}}>
                      <option value="high">High threat</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <button onClick={()=>{
                    const name = document.getElementById("mc-name")?.value?.trim();
                    const type = document.getElementById("mc-type")?.value?.trim()||"store";
                    const dist = document.getElementById("mc-dist")?.value?.trim()||"0.5";
                    const threat = document.getElementById("mc-threat")?.value||"medium";
                    if(!name) return;
                    const distM = Math.round(parseFloat(dist)*1609);
                    setCompetitorList(p=>[...p,{name,type,distance:dist+" miles",distM,threat,lat:mapLat,lng:mapLng}]);
                    if(document.getElementById("mc-name")) document.getElementById("mc-name").value="";
                    if(document.getElementById("mc-type")) document.getElementById("mc-type").value="";
                    if(document.getElementById("mc-dist")) document.getElementById("mc-dist").value="";
                  }} style={{marginTop:10,padding:"9px 20px",background:G.mid,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600}}>+ Add</button>
                </div>
              </div>
            )}

            {/* Planning applications */}
            {planningApps.length>0&&(
              <div style={{marginBottom:20}}>
                <Sub c="Planning Applications Detected Nearby"/>
                <div style={{background:"#1a2216",border:"1px solid "+G.orange,borderRadius:10,padding:14}}>
                  {planningApps.map((pa,i)=>(
                    <div key={i} style={{padding:"10px 0",borderBottom:i<planningApps.length-1?"1px solid "+G.border:"none"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                        <div>
                          <div style={{fontSize:12,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{pa.ref}</div>
                          <div style={{fontSize:13,color:G.text}}>{pa.desc}</div>
                          <div style={{fontSize:11,color:"#FFFFFF",marginTop:2}}>{pa.distance} · {pa.status}</div>
                        </div>
                        <div style={{padding:"3px 8px",borderRadius:4,fontSize:11,fontWeight:700,background:pa.risk==="high"?"#fde8e8":pa.risk==="medium"?"#fff4ea":"#dde4f5",color:pa.risk==="high"?"#d62828":pa.risk==="medium"?G.orange:G.mid,border:"1px solid "+(pa.risk==="high"?"#d62828":pa.risk==="medium"?G.orange:G.mid)+"44",flexShrink:0,whiteSpace:"nowrap"}}>{pa.risk.toUpperCase()} RISK</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:12,color:"#FFFFFF",marginTop:8}}>⚠ Planning data is indicative. Always verify with the Local Planning Authority before committing.</div>
              </div>
            )}

            {TRAFFIC_F.map(f=>(
              <div key={f.k} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:14,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                <div style={{flex:1}}><div style={{fontSize:15,color:G.text,fontWeight:500}}>{f.l}</div>{f.h&&<div style={{fontSize:12,color:"#FFFFFF",marginTop:2}}>{f.h}</div>}</div>
                {f.num?(
                  <input style={{...INP_manual,width:110,flexShrink:0,textAlign:"right"}} type="number" value={traffic[f.k]} onFocus={e=>e.target.select()} onChange={e=>setTraffic(p=>({...p,[f.k]:e.target.value===""?0:+e.target.value}))}/>
                ):(
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button onClick={()=>setTraffic(p=>({...p,[f.k]:true}))} style={{padding:"8px 16px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:14,border:"1.5px solid "+(traffic[f.k]?G.text:G.border),background:traffic[f.k]?G.pale:G.bg,color:traffic[f.k]?G.text:G.light,fontWeight:traffic[f.k]?700:400}}>Yes</button>
                    <button onClick={()=>setTraffic(p=>({...p,[f.k]:false}))} style={{padding:"8px 16px",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:14,border:"1.5px solid "+(!traffic[f.k]?G.text:G.border),background:!traffic[f.k]?G.pale:G.bg,color:!traffic[f.k]?G.text:G.light,fontWeight:!traffic[f.k]?700:400}}>No</button>
                  </div>
                )}
              </div>
            ))}
            <Row2 ch={[
              <Fld key="a" l="Parking spaces" ch={<input style={INP_manual} type="number" value={parking} onFocus={e=>e.target.select()} onChange={e=>setParking(e.target.value===""?0:+e.target.value)}/>}/>,
              <Fld key="b" l="Competitors within 0.5 mile" ch={<input style={postcodeData?INP_auto:INP_manual} type="number" value={competitors} onFocus={e=>e.target.select()} onChange={e=>setCompetitors(e.target.value===""?0:+e.target.value)}/>}/>,
            ]} st={{marginTop:8}}/>
            <Fld l="Nearest competitor (miles)" ch={<input style={postcodeData?INP_auto:INP_manual} type="number" step="0.1" value={nearestComp} onFocus={e=>e.target.select()} onChange={e=>setNearestComp(e.target.value===""?0:+e.target.value)}/>}/>
            <Fld l="Existing store address (optional — shows on map)" h="e.g. 1 Canterbury Parade, South Ockendon, RM15 6NH" ch={<div style={{display:"flex",gap:8}}>
              <input id="existing-store-addr" style={{...INP_manual,flex:1}} placeholder="e.g. 1 Canterbury Parade, South Ockendon, RM15 6NH" defaultValue={existingStore?.name||""}/>
              <button onClick={async()=>{
                const addr = document.getElementById("existing-store-addr")?.value?.trim();
                if(!addr) return;
                try {
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
                  const data = await res.json();
                  if(data[0]) setExistingStore({name:addr,lat:parseFloat(data[0].lat),lng:parseFloat(data[0].lon)});
                  else alert("Address not found — try adding the postcode");
                } catch(e) { alert("Lookup failed"); }
              }} style={{padding:"8px 14px",background:G.mid,color:"#fff",border:"none",borderRadius:7,cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:600,flexShrink:0}}>Locate</button>
              {existingStore&&<button onClick={()=>setExistingStore(null)} style={{padding:"8px 10px",background:"transparent",border:"1px solid "+G.border,borderRadius:7,cursor:"pointer",color:G.val,fontSize:13}}>✕</button>}
            </div>}/>
            <Sub c="Footfall by hour — sector average, override if needed"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:24}}>
              {FHOURS.map(h=>(
                <div key={h} style={{background:G.card,border:"1px solid "+G.border,borderRadius:8,padding:"10px 8px"}}>
                  <div style={{fontSize:11,color:"#FFFFFF",marginBottom:6,textAlign:"center"}}>{h}</div>
                  <input style={{...INP_auto,textAlign:"center",padding:"8px 6px"}} type="number" step="1" value={fhour[h]} onFocus={e=>e.target.select()} onChange={e=>setFhour(p=>({...p,[h]:e.target.value===""?0:+e.target.value}))}/>
                </div>
              ))}
            </div>
            <Sub c="Area trends"/>
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
            <Fld l="Area notes" ch={<textarea style={{...INP_manual,minHeight:80,lineHeight:1.5}} value={areaNotes} onChange={e=>setAreaNotes(e.target.value)} onBlur={saveAssessment} placeholder="e.g. 200-unit housing development 0.3 miles north due Q3 2026..."/>}/>

            {/* Comparable sites */}
            <Sub c="Comparable sites — Genesis Retail benchmarks"/>
            {comparables.map((comp,i)=>(
              <div key={i} style={{background:G.card,border:"1px solid "+G.border,borderRadius:10,padding:14,marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:10}}>Comparable {i+1}</div>
                <Fld l="Store name" ch={<input style={INP_manual} value={comp.name} onChange={e=>setComparables(p=>p.map((x,j)=>j===i?{...x,name:e.target.value}:x))} onBlur={async e=>{
                  const name = e.target.value.trim();
                  if(!name) return;
                  try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name)}&limit=1`);
                    const data = await res.json();
                    if(data[0]) setComparables(p=>p.map((x,j)=>j===i?{...x,lat:parseFloat(data[0].lat),lng:parseFloat(data[0].lon)}:x));
                  } catch(e2){}
                }} placeholder="e.g. Nisa, 11-13 Derwent Parade, RM15 5EF"/>}/>
                <Row2 ch={[
                  <Fld key="a" l="Weekly turnover (£)" ch={<input style={{...INP_manual,textAlign:"left",paddingLeft:14}} type="number" value={comp.weeklyT||""} placeholder="0" onFocus={e=>e.target.select()} onChange={e=>setComparables(p=>p.map((x,j)=>j===i?{...x,weeklyT:e.target.value===""?0:+e.target.value}:x))}/>}/>,
                  <Fld key="b" l="Sq ft" ch={<input style={{...INP_manual,textAlign:"left",paddingLeft:14}} type="number" value={comp.sqft||""} placeholder="0" onFocus={e=>e.target.select()} onChange={e=>setComparables(p=>p.map((x,j)=>j===i?{...x,sqft:e.target.value===""?0:+e.target.value}:x))}/>}/>,
                ]}/>
                <Fld l="Notes" ch={<input style={INP_manual} value={comp.notes} onChange={e=>setComparables(p=>p.map((x,j)=>j===i?{...x,notes:e.target.value}:x))} placeholder="Key observations..."/>}/>
                {comp.sqft>0&&comp.weeklyT>0&&comp.sqft>=100&&<div style={{fontSize:13,color:"#FFFFFF",fontWeight:600,marginTop:4}}>Sales density: £{(comp.weeklyT/comp.sqft).toFixed(2)}/sqft/wk vs this site: £{(C.upliftedSpf||0).toFixed(2)}/sqft/wk</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── SPREADSHEET ── */}
        {step===8&&(
          <div>
            <SH c="Spreadsheet View"/>

            {/* Export buttons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
              {/* Excel export */}
              <div style={{background:"#1E293B",border:"1.5px solid "+G.mid,borderRadius:12,padding:16}}>
                <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:6}}>📥 Export Excel</div>
                <div style={{fontSize:12,color:G.text,marginBottom:12,lineHeight:1.5}}>Fully populated workbook — P&L, 5-year, cashflow, sensitivity and glossary.</div>
                <button
                  onClick={()=>{
                    try {
                      const XLSX = window.XLSX;
                      if(!XLSX){ alert("Excel library loading — please try again in a moment."); return; }
                      const wb = XLSX.utils.book_new();
                      const summaryRows = [
                        ["GENESIS RETAIL — SITE VIABILITY ASSESSMENT","","",""],
                        [propName||"Site Assessment", postcode||"", new Date().toLocaleDateString("en-GB"), ""],
                        ["","","",""],
                        ["KEY FINANCIALS","","",""],
                        ["Base Weekly Turnover", C.wk, "Post-Refit Weekly Turnover", C.upliftedWk],
                        ["Annual Sales (post-refit)", C.upliftedAnn, "Gross Profit %", C.blGP/100],
                        ["Annual Gross Profit", C.annGP, "Total Annual Costs", C.annC],
                        ["EBITDA", C.eb, "EBITDA Margin", C.eb/C.upliftedAnn],
                        ["Annual Finance Cost", C.af, "Net Profit", C.nP],
                        ["Total Investment", C.ti, "ROI", C.roi/100],
                        ["Monthly Loan Payment", C.mp, "Payback Period (years)", C.pb||0],
                        ["Sales per Sq Ft / week", C.upliftedSpf, "Catchment Penetration", C.pen/100],
                        ["","","",""],
                        ["VERDICT", VRD.l, "", ""],
                        ["","","",""],
                        ["PROPERTY","","",""],
                        ["Net Selling Area (sq ft)", sqft, "Location Type", location],
                        ["Daily Transactions", footfall, "Average Basket (£)", avgBasket],
                        ["Post-Refit Uplift", uplift/100, "Trading Hours/Day", openHours],
                        ["","","",""],
                        ["COSTS","","",""],
                        ["Annual Rent", rent, "Business Rates", rates],
                        ["Staff % of Sales", staffPct/100, "Staff Cost (£)", C.stf],
                        ["Utilities", utilities, "Other Costs", otherCosts],
                        ["","","",""],
                        ["INVESTMENT","","",""],
                        ["Refit Cost", refitCost, "Opening Stock", stockCost],
                        ["Finance Rate (APR)", financeRate/100, "Finance Term (years)", financeYears],
                        ["","","",""],
                        ["CATCHMENT","","",""],
                        ["Catchment Population", catchmentPop, "Median Income", medianIncome],
                        ["Population Density", popDensity, "Deprivation Index", deprivation],
                      ];
                      const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
                      ws1["!cols"] = [{wch:32},{wch:18},{wch:32},{wch:18}];
                      XLSX.utils.book_append_sheet(wb, ws1, "Summary");

                      const yr5labels = ["Sales Revenue","Cost of Goods","GROSS PROFIT","","Rent","Business Rates","Staff & Wages","Utilities","Other Costs","TOTAL OP COSTS","","EBITDA","","Finance Cost","","NET PROFIT","","CUMULATIVE PROFIT"];
                      const yr5x = yr5.map((r,i)=>({...r,cogs:r.s-r.gp,rent_:rent*Math.pow(1.02,i),rates_:rates*Math.pow(1.02,i),stf_:r.stf2,utils_:utilities*Math.pow(1.02,i),other_:otherCosts*Math.pow(1.02,i),cum:yr5.slice(0,i+1).reduce((a,x)=>a+x.np,0)}));
                      const plRows = [["5-YEAR P&L — "+(propName||"Assessment"),"","","","","",""],["",..."Year 1,Year 2,Year 3,Year 4,Year 5".split(","),"5-Yr Total"]];
                      const plKeys = ["s","cogs","gp",null,"rent_","rates_","stf_","utils_","other_","tc",null,"eb",null,"fin",null,"np",null,"cum"];
                      plKeys.forEach((k,i)=>{ if(!k){plRows.push(["","","","","","",""]);return;} const tot=["cum"].includes(k)?"":yr5x.reduce((a,r)=>a+(r[k]||0),0); plRows.push([yr5labels[i],...yr5x.map(r=>r[k]||0),tot]); });
                      const ws2 = XLSX.utils.aoa_to_sheet(plRows);
                      ws2["!cols"] = [{wch:28},...Array(6).fill({wch:14})];
                      XLSX.utils.book_append_sheet(wb, ws2, "5-Year P&L");

                      const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
                      const ann1=C.upliftedAnn, mNet=ann1*(C.blGP/100)/12-(rent+rates+(ann1*staffPct/100)+utilities+otherCosts)/12-C.mp;
                      const cfRows=[["MONTHLY CASHFLOW — YEAR 1"],["Item",...months,"Total"],
                        ["Sales Revenue",...months.map(()=>ann1/12),ann1],
                        ["Cost of Goods",...months.map(()=>-(ann1*(1-C.blGP/100))/12),-(ann1*(1-C.blGP/100))],
                        ["GROSS PROFIT",...months.map(()=>ann1*(C.blGP/100)/12),ann1*(C.blGP/100)],
                        ["Rent",...months.map(()=>-rent/12),-rent],
                        ["Staff",...months.map(()=>-(ann1*staffPct/100)/12),-(ann1*staffPct/100)],
                        ["Utilities",...months.map(()=>-utilities/12),-utilities],
                        ["Other",...months.map(()=>-otherCosts/12),-otherCosts],
                        ["Loan Repayment",...months.map(()=>-C.mp),-C.mp*12],
                        ["NET CASHFLOW",...months.map(()=>mNet),mNet*12],
                      ];
                      let bal=0;
                      cfRows.push(["Closing Balance",...months.map(()=>{bal+=mNet;return bal;}),bal]);
                      const ws3 = XLSX.utils.aoa_to_sheet(cfRows);
                      ws3["!cols"] = [{wch:20},...Array(13).fill({wch:11})];
                      XLSX.utils.book_append_sheet(wb, ws3, "Monthly Cashflow");

                      const sensRows=[["SENSITIVITY — ROI %"],["Footfall ↕ / Rent →","Rent -20%","Rent -10%","Rent 0%","Rent +10%","Rent +20%"],...sensitivityData.map(row=>[`Footfall ${row[0].fp>0?"+":""}${row[0].fp}%`,...row.map(c=>c.roi/100)])];
                      const ws4=XLSX.utils.aoa_to_sheet(sensRows); ws4["!cols"]=[{wch:22},...Array(5).fill({wch:14})];
                      XLSX.utils.book_append_sheet(wb,ws4,"Sensitivity");

                      const leaseRows=[["LEASE CALCULATOR"],["Target ROI %","Max Rent","Asking Rent","Headroom","Status"],...rentSensitivity.map(({tgt,maxR})=>[tgt/100,maxR,rent,maxR-rent,maxR>rent?"OK":"Over budget"])];
                      const ws5=XLSX.utils.aoa_to_sheet(leaseRows); ws5["!cols"]=[{wch:14},{wch:18},{wch:16},{wch:18},{wch:14}];
                      XLSX.utils.book_append_sheet(wb,ws5,"Lease Calculator");

                      const catRows=[["CATEGORY MIX"],["Category","Mix %","GP %","Annual Sales","Annual GP"],...cats.map(c=>[c.name,c.mix/100,c.gp/100,C.ann*c.mix/100,C.ann*c.mix/100*c.gp/100]),["TOTAL",cats.reduce((s,c)=>s+c.mix,0)/100,C.blGP/100,C.ann,C.annGP]];
                      const ws6=XLSX.utils.aoa_to_sheet(catRows); ws6["!cols"]=[{wch:26},{wch:10},{wch:10},{wch:18},{wch:18}];
                      XLSX.utils.book_append_sheet(wb,ws6,"Category Mix");

                      const filename=(propName||"genesis-assessment").replace(/[^a-zA-Z0-9]/g,"-").toLowerCase()+"-viability.xlsx";
                      XLSX.writeFile(wb, filename);
                    } catch(e){ alert("Export failed: "+e.message); }
                  }}
                  style={{width:"100%",padding:12,background:G.mid,border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:14,fontWeight:700}}
                >
                  📥 Download Excel
                </button>
              </div>

              {/* PowerPoint export */}
              <div style={{background:"#1a2216",border:"1.5px solid "+G.orange,borderRadius:12,padding:16}}>
                <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:6}}>📊 Export PowerPoint</div>
                <div style={{fontSize:12,color:G.text,marginBottom:12,lineHeight:1.5}}>12-slide bank-grade deck — cover, financials, P&L, 5-year, investment, categories, demographics, site, risks, symbol groups and recommendation.</div>
                <PPTXExportButton
                  propName={propName} postcode={postcode} location={location}
                  sqft={sqft} footfall={footfall} avgBasket={avgBasket} uplift={uplift}
                  rent={rent} rates={rates} staffPct={staffPct} utilities={utilities} otherCosts={otherCosts}
                  refitCost={refitCost} stockCost={stockCost} financeRate={financeRate} financeYears={financeYears}
                  cats={cats} ageBands={ageBands} catchmentPop={catchmentPop} medianIncome={medianIncome}
                  deprivation={deprivation} popDensity={popDensity} householdSz={householdSz}
                  competitors={competitors} nearestComp={nearestComp} parking={parking}
                  tHP={tHP} tPG={tPG} tNH={tNH} tFF={tFF} tRG={tRG} tVA={tVA}
                  areaNotes={areaNotes} storeNote={storeNote} clientName={clientName}
                  C={C} VRD={VRD} yr5={yr5} risks={risks}
                />
              </div>
            </div>


            {/* In-app spreadsheet sheets */}
            {(()=>{
              const sheets = [
                {id:"pl",     label:"P&L"},
                {id:"cf",     label:"Cashflow"},
                {id:"sens",   label:"Sensitivity"},

                {id:"cats",   label:"Categories"},
              ];
              const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
              const ann1 = C.upliftedAnn;
              const yr5x = yr5.map((r,i)=>({
                ...r,
                cogs:  r.s-r.gp,
                rent_:  rent*Math.pow(1.02,i),
                rates_: rates*Math.pow(1.02,i),
                utils_: utilities*Math.pow(1.02,i),
                other_: otherCosts*Math.pow(1.02,i),
                cum:   yr5.slice(0,i+1).reduce((a,x)=>a+x.np,0),
                gm:    r.gp/r.s*100,
                em:    r.eb/r.s*100,
                nm:    r.np/r.s*100,
                roi_:  r.np/C.ti*100,
              }));

              const TH = (t,right)=>(
                <th style={{padding:"8px 10px",background:G.mid,color:"#fff",fontSize:11,fontWeight:700,textAlign:right?"right":"left",whiteSpace:"nowrap",position:"sticky",top:0}}>{t}</th>
              );
              const TD = (v,bold,neg,hi,pctFmt)=>(
                <td style={{padding:"7px 10px",fontSize:12,textAlign:"right",fontWeight:bold?700:400,color:neg?"#d62828":hi?G.text:G.light,background:hi?"#dde4f5":"transparent",borderBottom:"1px solid "+G.border,whiteSpace:"nowrap"}}>
                  {v===null||v===undefined?"":pctFmt?pct(v):typeof v==="number"?fmt(v):v}
                </td>
              );
              const TDL = (v,bold,indent,hi)=>(
                <td style={{padding:"7px 10px",fontSize:12,fontWeight:bold?700:400,color:hi?G.text:G.light,paddingLeft:indent?22:10,background:hi?G.pale:"transparent",borderBottom:"1px solid "+G.border,whiteSpace:"nowrap"}}>{v}</td>
              );
              const SectionRow = (label)=>(
                <tr><td colSpan={10} style={{background:G.mid,padding:"5px 10px",fontSize:10,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:".1em"}}>{label}</td></tr>
              );

              return (
                <div>
                  {/* Sheet tabs */}
                  <div style={{display:"flex",gap:2,marginBottom:0,borderBottom:"2px solid "+G.mid,overflowX:"auto"}}>
                    {sheets.map(s=>(
                      <button key={s.id} onClick={()=>setSheet(s.id)} style={{padding:"8px 14px",background:sheet===s.id?"#fff":G.card,border:"1px solid "+G.border,borderBottom:sheet===s.id?"2px solid #fff":"none",borderRadius:"6px 6px 0 0",color:sheet===s.id?G.text:G.light,fontSize:12,fontWeight:sheet===s.id?700:400,cursor:"pointer",fontFamily:"inherit",flexShrink:0,marginBottom:sheet===s.id?-2:0}}>
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div style={{border:"1px solid "+G.border,borderTop:"none",borderRadius:"0 0 10px 10px",overflowX:"auto",background:"#fff"}}>

                    {/* ── P&L Sheet ── */}
                    {sheet==="pl"&&(
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <thead>
                          <tr>
                            {TH("",false)}
                            {yr5x.map((_,i)=>TH("Year "+(i+1),true))}
                            {TH("5-Yr Total",true)}
                          </tr>
                        </thead>
                        <tbody>
                          {SectionRow("Income")}
                          <tr>{TDL("Sales Revenue",true,false,false)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:G.text,borderBottom:"1px solid "+G.border}}>{fmt(r.s)}</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:G.text,borderBottom:"1px solid "+G.border}}>{fmt(yr5x.reduce((a,r)=>a+r.s,0))}</td></tr>
                          <tr>{TDL("Cost of Goods",false,true,false)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(r.cogs)})</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(yr5x.reduce((a,r)=>a+r.cogs,0))})</td></tr>
                          <tr style={{background:G.pale}}>{TDL("GROSS PROFIT",true,false,true)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:G.text,borderBottom:"1px solid "+G.border}}>{fmt(r.gp)}</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:G.text,borderBottom:"1px solid "+G.border}}>{fmt(yr5x.reduce((a,r)=>a+r.gp,0))}</td></tr>
                          {SectionRow("Operating Costs")}
                          {[["Rent",       r=>r.rent_],["Business Rates",r=>r.rates_],["Staff & Wages",r=>r.stf2],["Utilities",r=>r.utils_],["Other Costs",r=>r.other_]].map(([l,fn])=>(
                            <tr key={l}>{TDL(l,false,true,false)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(fn(r))})</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(yr5x.reduce((a,r)=>a+fn(r),0))})</td></tr>
                          ))}
                          <tr style={{background:G.pale}}>{TDL("TOTAL OP COSTS",true,false,true)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(r.tc)})</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(yr5x.reduce((a,r)=>a+r.tc,0))})</td></tr>
                          {SectionRow("EBITDA")}
                          <tr style={{background:"#1E293B"}}>{TDL("EBITDA",true,false,true)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:r.eb>=0?G.pos:G.neg,borderBottom:"1px solid "+G.border}}>{r.eb<0?"("+fmt(Math.abs(r.eb))+")":fmt(r.eb)}</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:yr5x.reduce((a,r)=>a+r.eb,0)>=0?G.mid:"#d62828",borderBottom:"1px solid "+G.border}}>{fmt(yr5x.reduce((a,r)=>a+r.eb,0))}</td></tr>
                          {SectionRow("Finance")}
                          <tr>{TDL("Loan Repayment",false,true,false)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(r.fin)})</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>({fmt(yr5x.reduce((a,r)=>a+r.fin,0))})</td></tr>
                          {SectionRow("Net Profit")}
                          <tr style={{background:"#b8e0e8"}}>{TDL("NET PROFIT",true,false,true)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:13,fontWeight:800,color:r.np>=0?G.pos:G.neg,borderBottom:"1px solid "+G.border}}>{r.np<0?"("+fmt(Math.abs(r.np))+")":fmt(r.np)}</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:13,fontWeight:800,color:yr5x.reduce((a,r)=>a+r.np,0)>=0?G.mid:"#d62828",borderBottom:"1px solid "+G.border}}>{fmt(yr5x.reduce((a,r)=>a+r.np,0))}</td></tr>
                          <tr style={{background:"#b8e0e8"}}>{TDL("CUMULATIVE NET PROFIT",true,false,true)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,fontWeight:700,color:r.cum>=0?G.pos:G.neg,borderBottom:"1px solid "+G.border}}>{r.cum<0?"("+fmt(Math.abs(r.cum))+")":fmt(r.cum)}</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>—</td></tr>
                          {SectionRow("Key Ratios")}
                          {[["Gross Margin %",r=>r.gm],["EBITDA Margin %",r=>r.em],["Net Margin %",r=>r.nm],["ROI %",r=>r.roi_]].map(([l,fn])=>(
                            <tr key={l} style={{background:G.card}}>{TDL(l,false,false,false)}{yr5x.map((r,i)=><td key={i} style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:fn(r)>=0?G.pos:G.neg,borderBottom:"1px solid "+G.border}}>{pct(fn(r))}</td>)}<td style={{padding:"7px 10px",textAlign:"right",fontSize:12,color:G.val,borderBottom:"1px solid "+G.border}}>—</td></tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* ── Cashflow Sheet ── */}
                    {sheet==="cf"&&(
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                        <thead>
                          <tr>
                            {TH("",false)}
                            {months.map(m=>TH(m,true))}
                            {TH("Total",true)}
                          </tr>
                        </thead>
                        <tbody>
                          {(()=>{
                            const mSales  =  ann1/12;
                            const mCogs   = -(ann1*(1-C.blGP/100))/12;
                            const mGP     =  ann1*(C.blGP/100)/12;
                            const mRent   = -rent/12;
                            const mRates  = -rates/12;
                            const mStaff  = -(ann1*staffPct/100)/12;
                            const mUtils  = -utilities/12;
                            const mOther  = -otherCosts/12;
                            const mFin    = -C.mp;
                            const mTotOut = mRent+mRates+mStaff+mUtils+mOther+mFin;
                            const mNet    = mGP+mTotOut;
                            const cfItems = [
                              {l:"INFLOWS",type:"hdr"},
                              {l:"Sales Revenue",v:mSales},
                              {l:"TOTAL INFLOWS",v:mSales,bold:true,hi:true},
                              {l:"",type:"gap"},
                              {l:"OUTFLOWS",type:"hdr"},
                              {l:"Cost of Goods",v:mCogs},
                              {l:"Rent",v:mRent},
                              {l:"Business Rates",v:mRates},
                              {l:"Staff & Wages",v:mStaff},
                              {l:"Utilities",v:mUtils},
                              {l:"Other Costs",v:mOther},
                              {l:"Loan Repayment",v:mFin},
                              {l:"TOTAL OUTFLOWS",v:mTotOut,bold:true,hi:true},
                              {l:"",type:"gap"},
                              {l:"NET CASHFLOW",v:mNet,bold:true,hi2:true},
                            ];
                            let running=0;
                            return cfItems.map((item,idx)=>{
                              if(item.type==="hdr") return <tr key={idx}><td colSpan={14} style={{background:G.mid,padding:"5px 10px",fontSize:10,fontWeight:700,color:"#fff",textTransform:"uppercase",letterSpacing:".1em"}}>{item.l}</td></tr>;
                              if(item.type==="gap"||!item.l) return <tr key={idx}><td colSpan={14} style={{height:6}}></td></tr>;
                              const bg = item.hi?"#dde4f5":item.hi2?"#b8e0e8":"transparent";
                              const col = item.v<0?"#c05010":item.hi||item.hi2?G.mid:G.dark;
                              return (
                                <tr key={idx} style={{background:bg}}>
                                  <td style={{padding:"6px 10px",fontSize:11,fontWeight:item.bold?700:400,color:item.bold?G.text:G.text,borderBottom:"1px solid "+G.border,whiteSpace:"nowrap"}}>{item.l}</td>
                                  {months.map((_,mi)=>(
                                    <td key={mi} style={{padding:"6px 8px",textAlign:"right",fontSize:11,fontWeight:item.bold?700:400,color:col,borderBottom:"1px solid "+G.border,whiteSpace:"nowrap"}}>
                                      {item.v<0?"("+fmt(Math.abs(item.v))+")":fmt(item.v)}
                                    </td>
                                  ))}
                                  <td style={{padding:"6px 8px",textAlign:"right",fontSize:11,fontWeight:700,color:col,borderBottom:"1px solid "+G.border,whiteSpace:"nowrap"}}>
                                    {item.v<0?"("+fmt(Math.abs(item.v*12))+")":fmt(item.v*12)}
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                          {/* Running balance */}
                          <tr><td colSpan={14} style={{height:4}}></td></tr>
                          {(()=>{
                            const mNet = C.upliftedAnn*(C.blGP/100)/12 - (rent+rates+(C.upliftedAnn*staffPct/100)+utilities+otherCosts)/12 - C.mp;
                            let bal=0;
                            return (
                              <tr style={{background:"#b8e0e8"}}>
                                <td style={{padding:"6px 10px",fontSize:11,fontWeight:700,color:G.text,borderBottom:"1px solid "+G.border}}>Closing Cash Balance</td>
                                {months.map((_,mi)=>{
                                  bal+=mNet;
                                  return <td key={mi} style={{padding:"6px 8px",textAlign:"right",fontSize:11,fontWeight:700,color:bal>=0?G.pos:G.neg,borderBottom:"1px solid "+G.border,whiteSpace:"nowrap"}}>{bal<0?"("+fmt(Math.abs(bal))+")":fmt(bal)}</td>;
                                })}
                                <td style={{padding:"6px 8px",textAlign:"right",fontSize:11,fontWeight:700,color:bal>=0?G.pos:G.neg,borderBottom:"1px solid "+G.border}}>{bal<0?"("+fmt(Math.abs(bal))+")":fmt(bal)}</td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    )}

                    {/* ── Sensitivity Sheet ── */}
                    {sheet==="sens"&&(
                      <div style={{padding:16}}>
                        <div style={{fontSize:13,color:G.text,marginBottom:12,lineHeight:1.6}}>ROI % across 25 scenarios — footfall and rent varying ±10/20% from base. <strong style={{color:"#FFFFFF"}}>Green ≥20%</strong> · <strong style={{color:"#FFFFFF"}}>Amber 10–20%</strong> · <strong style={{color:"#d62828"}}>Red &lt;10%</strong></div>
                        <table style={{width:"100%",borderCollapse:"collapse"}}>
                          <thead>
                            <tr>
                              <th style={{padding:"8px 12px",background:G.mid,color:"#fff",fontSize:11,fontWeight:700,textAlign:"left"}}>Footfall ↕ / Rent →</th>
                              {[-20,-10,0,10,20].map(rp=><th key={rp} style={{padding:"8px 10px",background:G.mid,color:"#fff",fontSize:11,fontWeight:700,textAlign:"center"}}>Rent {rp>0?"+":""}{rp}%</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {sensitivityData.map((row,ri)=>(
                              <tr key={ri}>
                                <td style={{padding:"10px 12px",fontSize:12,fontWeight:700,color:G.text,background:G.card,borderBottom:"1px solid "+G.border}}>Footfall {row[0].fp>0?"+":""}{row[0].fp}%</td>
                                {row.map((cell,ci)=>{
                                  const isBase=cell.fp===0&&cell.rp===0;
                                  const bg=isBase?"#dde4f5":cell.roi>=20?"#dde4f5":cell.roi>=10?"#fff4ea":"#fde8e8";
                                  const col=isBase?"#FFFFFF":cell.roi>=20?"#22C55E":cell.roi>=10?"#F59E0B":"#EF4444";
                                  return <td key={ci} style={{padding:"10px",textAlign:"center",background:bg,fontWeight:isBase?800:600,color:col,fontSize:13,border:isBase?"2px solid "+G.mid:"1px solid "+G.border}}>{cell.roi.toFixed(1)}%{isBase&&<div style={{fontSize:9,fontWeight:400,color:G.light}}>BASE</div>}</td>;
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{fontSize:11,color:"#FFFFFF",marginTop:10}}>Base: {footfall} transactions/day · {fmt(rent)}/yr rent · {uplift}% uplift · {fmt(C.ti)} investment</div>
                      </div>
                    )}

                    {/* ── Categories Sheet ── */}
                    {sheet==="cats"&&(
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                        <thead>
                          <tr>
                            {["Category","Sales Mix","GP %","Annual Sales","Annual GP","GP Contribution"].map(h=>(
                              <th key={h} style={{padding:"8px 10px",background:G.mid,color:"#fff",fontSize:11,fontWeight:700,textAlign:h==="Category"?"left":"right",whiteSpace:"nowrap"}}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...cats].sort((a,b)=>b.mix-a.mix).map((cat,i)=>(
                            <tr key={i} style={{background:i%2===0?G.card:"#fff",borderBottom:"1px solid "+G.border}}>
                              <td style={{padding:"8px 10px",fontSize:12,color:G.text}}>{cat.icon} {cat.name}</td>
                              <td style={{padding:"8px 10px",textAlign:"right",fontSize:12,color:G.val,fontWeight:600}}>{cat.mix}%</td>
                              <td style={{padding:"8px 10px",textAlign:"right",fontSize:12,color:G.val}}>{cat.gp}%</td>
                              <td style={{padding:"8px 10px",textAlign:"right",fontSize:12,color:G.text,fontWeight:600}}>{fmt(C.upliftedAnn*cat.mix/100)}</td>
                              <td style={{padding:"8px 10px",textAlign:"right",fontSize:12,color:"#FFFFFF",fontWeight:600}}>{fmt(C.upliftedAnn*cat.mix/100*cat.gp/100)}</td>
                              <td style={{padding:"8px 10px",textAlign:"right",fontSize:12}}>
                                <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"flex-end"}}>
                                  <div style={{width:60,height:6,background:G.pale,borderRadius:3}}>
                                    <div style={{height:"100%",background:G.mid,borderRadius:3,width:Math.min(cat.mix*4,100)+"%"}}/>
                                  </div>
                                  <span style={{color:"#FFFFFF",minWidth:30}}>{pct(C.ann*cat.mix/100*cat.gp/100/C.annGP*100)}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr style={{background:G.pale,borderTop:"2px solid "+G.mid}}>
                            <td style={{padding:"9px 10px",fontSize:13,fontWeight:700,color:G.text}}>TOTAL</td>
                            <td style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:700,color:G.text}}>{cats.reduce((s,c)=>s+c.mix,0)}%</td>
                            <td style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:700,color:"#FFFFFF"}}>{pct(C.blGP)}</td>
                            <td style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:700,color:"#FFFFFF"}}>{fmt(C.upliftedAnn)}</td>
                            <td style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:700,color:"#FFFFFF"}}>{fmt(C.annGP)}</td>
                            <td style={{padding:"9px 10px",textAlign:"right",fontSize:13,fontWeight:700,color:G.text}}>100%</td>
                          </tr>
                        </tbody>
                      </table>
                    )}

                  </div>
                </div>
              );
            })()}

          </div>
        )}

        {/* ── RESULTS ── */}
        {step===9&&(
          <div>
            {/* Assessment header */}
            <div style={{background:"#F1F5F9",borderRadius:10,padding:"16px 20px",marginBottom:16}}>
              <div style={{fontSize:9,letterSpacing:".25em",color:"#15803D",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Genesis Retail — Site Assessment</div>
              <div style={{fontSize:18,fontWeight:800,color:"#fff",marginBottom:clientName?6:0}}>{propName||"Unnamed Site"}{postcode?" · "+postcode:""}</div>
              {clientName&&<div style={{fontSize:13,color:"#374151"}}>Prepared for <strong style={{color:"#fff"}}>{clientName}</strong></div>}
              {!clientName&&<div style={{fontSize:12,color:"#374151",fontStyle:"italic"}}>Add client name on the Cover tab</div>}
            </div>

            {/* ── VERDICT HERO BLOCK ── */}
            <div style={{background:"#ffffff",border:"1px solid #CBD5E1",borderRadius:10,padding:"20px 24px",marginBottom:16}}>
              <div style={{fontSize:9,letterSpacing:".25em",color:"#15803D",textTransform:"uppercase",fontWeight:700,marginBottom:12}}>Assessment Verdict</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:16}}>
                {[
                  ["ROI",pct(C.roi),C.roi>=20?"#22C55E":C.roi>=10?"#F59E0B":"#EF4444"],
                  ["Net Profit (Yr 1)",fmt(C.nP),"#FFFFFF"],
                  ["Payback",C.nP>0?(C.ti/C.nP).toFixed(1)+" yrs":"—","#FFFFFF"],
                  ["Investment",fmt(C.ti),"#FFFFFF"],
                  ["Turnover (Yr 1)",fmt(C.ann),"#FFFFFF"],
                  ["EBITDA",fmt(C.ebitda),"#FFFFFF"],
                ].map(([label,value,col])=>(
                  <div key={label} style={{background:"#F8FAFC",borderRadius:8,padding:"12px 14px"}}>
                    <div style={{fontSize:9,letterSpacing:".12em",textTransform:"uppercase",color:"#C7D0D5",marginBottom:4,fontWeight:600}}>{label}</div>
                    <div style={{fontSize:20,fontWeight:800,color:col,lineHeight:1}}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{borderTop:"1px solid #2a3a42",paddingTop:12,fontSize:13,color:"#C7D0D5",lineHeight:1.7}}>
                <strong style={{color:VRD?.col||"#FFFFFF"}}>{VRD?.label||"Assessment incomplete"}</strong>
                {VRD?.summary&&<span> — {VRD.summary}</span>}
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <button onClick={generatePDF} disabled={pdfLoading} style={{width:"100%",padding:15,background:pdfLoading?"#8fa3d6":G.mid,border:"none",borderRadius:10,color:"#fff",cursor:pdfLoading?"not-allowed":"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700}}>
                {pdfLoading?"⏳ Generating PDF…":"⬇ Download Report as PDF"}
              </button>
              <p style={{fontSize:12,color:"#111827",marginTop:8,textAlign:"center"}}>Downloads a full A4 PDF directly to your device.</p>
            </div>

            {/* ROI context note */}
            {C.roi>50&&(
              <div style={{background:"#F8FAFC",border:"2px solid #1e3a8a",borderRadius:10,padding:"18px 20px",marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10}}>Note on Return on Investment — {pct(C.roi)}</div>
                <div style={{fontSize:13,color:"#374151",lineHeight:1.9}}>
                  {`The return on investment figure of ${pct(C.roi)} reflects the relatively low capital requirement against an established trading base. The ${fmt(C.wk)} weekly turnover used as the base figure is drawn from the operator's existing trading performance and is not a speculative projection — it represents real, evidenced sales from a store serving this catchment today.`}
                </div>
                <div style={{fontSize:13,color:"#111827",lineHeight:1.9,marginTop:10}}>
                  {`The total investment of ${fmt(C.ti)} — comprising a ${fmt(refitCost)} refit and ${fmt(stockCost)} opening stock — should be supported by shopfitter quotes and a stock valuation from the chosen symbol group wholesaler before submission to any lender. The post-refit uplift of ${uplift}% is based on the increased store footprint, extended chilled capacity, symbol group conversion and the introduction of a dedicated world foods range. Comparable store evidence is provided in Section 4b of this report.`}
                </div>
                <div style={{fontSize:12,color:"#111827",marginTop:10,fontStyle:"italic"}}>
                  Genesis Retail recommends this figure is presented alongside 12 months of till data or bank statements from the existing store to evidence the base turnover assumption.
                </div>
              </div>
            )}

            {/* ── 5-YEAR P&L — screen view ── */}
            <div style={{background:"#fff",border:"1.5px solid #1e3a8a",borderRadius:12,overflow:"hidden",marginBottom:20}}>
              <div style={{borderBottom:"2px solid #1e3a8a",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#374151"}}>Five-Year Profit & Loss Forecast</div>
                <div style={{fontSize:11,color:"#374151"}}>3% sales growth · 2% cost inflation</div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                  <thead>
                    <tr style={{background:"#F8FAFC"}}>
                      <th style={{padding:"10px 12px",textAlign:"left",color:"#111827",fontWeight:700,minWidth:160}}>£</th>
                      {[1,2,3,4,5].map(y=><th key={y} style={{padding:"10px 8px",textAlign:"right",color:"#111827",fontWeight:700,minWidth:90}}>Year {y}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {l:"Sales Revenue",      k:"s",   neg:false, hi:false, sub:false},
                      {l:"Gross Profit",        k:"gp",  neg:false, hi:false, sub:true},
                      {l:"Operating Costs",     k:"tc",  neg:true,  hi:false, sub:false},
                      {l:"EBITDA",              k:"eb",  neg:false, hi:true,  sub:true},
                      {l:"Finance Cost",        k:"fin", neg:true,  hi:false, sub:false},
                      {l:"Net Profit",          k:"np",  neg:false, hi:true,  sub:true},
                    ].map((dr,i)=>(
                      <tr key={i} style={{background:dr.hi?"#eef1fb":dr.sub?G.pale:i%2===0?G.card:"#fff",borderBottom:"1px solid "+G.border}}>
                        <td style={{padding:"10px 12px",fontSize:13,fontWeight:dr.hi||dr.sub?700:400,color:dr.hi?G.text:G.light}}>{dr.l}</td>
                        {yr5.map((r,j)=>{
                          const val=dr.neg?-r[dr.k]:r[dr.k];
                          const neg=val<0;
                          return <td key={j} style={{padding:"10px 8px",textAlign:"right",fontWeight:dr.hi||dr.sub?700:400,color:neg?"#d62828":dr.hi?G.text:G.light,fontSize:13}}>
                            {neg?"("+fmt(Math.abs(val))+")":fmt(val)}
                          </td>;
                        })}
                      </tr>
                    ))}
                    <tr style={{background:"#F8FAFC",borderTop:"2px solid #1e3a8a"}}>
                      <td style={{padding:"10px 12px",fontSize:13,fontWeight:700,color:"#374151"}}>Cumulative Net Profit</td>
                      {[1,2,3,4,5].map(y=>{
                        const cn=cumNp(y);
                        return <td key={y} style={{padding:"10px 8px",textAlign:"right",fontWeight:800,color:cn<0?"#d62828":"#1e3a8a",fontSize:13}}>
                          {cn<0?"("+fmt(Math.abs(cn))+")":fmt(cn)}
                        </td>;
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{padding:"10px 14px",background:"#F8FAFC",borderTop:"1px solid "+G.border,fontSize:11,color:"#64748B"}}>
                Base: {fmt(C.upliftedAnn)}/yr post-refit · Total investment {fmt(C.ti)} · Finance {financeRate}% APR over {financeYears} years · Payback {C.pb?C.pb.toFixed(1)+" years":"N/A"}
              </div>
            </div>



            {/* COVER — new design: square photo, address, Genesis info, short summary */}
            <div ref={pdfRef} className="pdf-wrapper" style={{background:"#fff",fontFamily:"'Helvetica Neue',Arial,sans-serif",color:"#111827",lineHeight:1.6,fontSize:12}}>

{/*──────────────────────────────────────────────────────────────
   PAGE 1 — EXECUTIVE SUMMARY
──────────────────────────────────────────────────────────────*/}
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>

  {/* Masthead */}
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingBottom:14,borderBottom:"3px solid #15803D",marginBottom:22}}>
    <div>
      <div style={{fontSize:8,letterSpacing:".3em",color:"#15803D",textTransform:"uppercase",fontWeight:700,marginBottom:3}}>Genesis Retail — Site Viability Assessment</div>
      <div style={{fontSize:22,fontWeight:700,color:"#111827",letterSpacing:"-.3px"}}>{propName||"Site Assessment"}</div>
      <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{postcode}{location?` · ${location}`:""}</div>
    </div>
    <div style={{textAlign:"right",fontSize:10,color:"#64748B"}}>
      <div>Date: {new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
      <div style={{marginTop:1}}>Consultant: Richard Shorney</div>
      {clientName&&<div style={{marginTop:1}}>Prepared for: <strong style={{color:"#111827"}}>{clientName}</strong></div>}
    </div>
  </div>

  {/* VERDICT — dominant */}
  {(()=>{
    const isPass=C.roi>=20, isCaution=C.roi>=10&&C.roi<20, isFail=C.roi<10;
    const label=isPass?"PROCEED":isCaution?"PROCEED WITH CAUTION":"DO NOT PROCEED";
    const bg=isPass?"#F0FDF4":isCaution?"#FFFBEB":"#FEF2F2";
    const border=isPass?"#15803D":isCaution?"#B45309":"#DC2626";
    const col=border;
    const icon=isPass?"✅":isCaution?"⚠️":"❌";
    return (
      <div style={{background:bg,border:`2.5px solid ${border}`,borderRadius:8,padding:"20px 26px",marginBottom:20,display:"flex",alignItems:"center",gap:20}}>
        <div style={{flex:1}}>
          <div style={{fontSize:8,letterSpacing:".2em",color:col,textTransform:"uppercase",fontWeight:700,marginBottom:5}}>Genesis Retail Assessment Verdict</div>
          <div style={{fontSize:36,fontWeight:900,color:col,letterSpacing:"-1px",lineHeight:1,marginBottom:8}}>{label}</div>
          <div style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{isPass?`This site demonstrates strong commercial viability. A ${pct(C.roi)} ROI with a ${C.pb?C.pb.toFixed(1)+"-year":""} payback meets Genesis Retail's investment threshold.`:isCaution?`This site shows moderate viability. ROI of ${pct(C.roi)} is below the preferred 20% threshold. Proceed subject to cost reduction or revised trading assumptions.`:`The current financial model does not support a recommendation to proceed. ROI of ${pct(C.roi)} falls below the minimum threshold.`}</div>
        </div>
        <div style={{fontSize:56,lineHeight:1}}>{icon}</div>
      </div>
    );
  })()}

  {/* Investment Snapshot */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:16}}>
    {(()=>{
      const rr=risks?.filter(r=>r.rag==="red").length||0;
      return [
        {l:"ROI",v:pct(C.roi),bg:C.roi>=20?"#F0FDF4":C.roi>=10?"#FFFBEB":"#FEF2F2",c:C.roi>=20?"#15803D":C.roi>=10?"#B45309":"#DC2626",bd:C.roi>=20?"#BBF7D0":C.roi>=10?"#FDE68A":"#FECACA"},
        {l:"Net Profit (Yr 1)",v:fmt(C.nP),bg:C.nP>0?"#F0FDF4":"#FEF2F2",c:C.nP>0?"#15803D":"#DC2626",bd:C.nP>0?"#BBF7D0":"#FECACA"},
        {l:"Investment Required",v:fmt(C.ti),bg:"#F0FDF4",c:"#15803D",bd:"#BBF7D0"},
        {l:"Payback Period",v:C.pb?C.pb.toFixed(1)+" yrs":"N/A",bg:"#F8FAFC",c:"#111827",bd:"#CBD5E1"},
        {l:"Risk Rating",v:rr>2?"HIGH":rr>0?"MEDIUM":"LOW",bg:rr>2?"#FEF2F2":rr>0?"#FFFBEB":"#F0FDF4",c:rr>2?"#DC2626":rr>0?"#B45309":"#15803D",bd:rr>2?"#FECACA":rr>0?"#FDE68A":"#BBF7D0"},
      ];
    })().map(({l,v,bg,c,bd})=>(
      <div key={l} style={{background:bg,border:`1px solid ${bd}`,borderRadius:6,padding:"11px 10px"}}>
        <div style={{fontSize:8,letterSpacing:".1em",textTransform:"uppercase",color:"#64748B",fontWeight:600,marginBottom:4}}>{l}</div>
        <div style={{fontSize:20,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
      </div>
    ))}
  </div>

  {/* Secondary KPIs */}
  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,paddingBottom:14,marginBottom:14,borderBottom:"1px solid #CBD5E1"}}>
    {[[fmt(C.upliftedAnn),"Annual Turnover"],[fmt(C.eb),"EBITDA"],[pct(C.blGP),"Gross Margin"],[sqft>0?`£${(C.upliftedWk/sqft).toFixed(2)}/wk`:"—","Sales / sq ft / wk"]].map(([v,l])=>(
      <div key={l} style={{borderLeft:"3px solid #15803D",paddingLeft:9}}>
        <div style={{fontSize:8,letterSpacing:".1em",textTransform:"uppercase",color:"#64748B",fontWeight:600}}>{l}</div>
        <div style={{fontSize:16,fontWeight:700,color:"#111827"}}>{v}</div>
      </div>
    ))}
  </div>

  {/* Assessment confidence */}
  {(()=>{
    const fields=[propName,postcode,sqft,catchmentPop,rent,rates,refitCost,footfall,avgBasket].filter(Boolean);
    const conf=Math.round((fields.length/9)*100);
    return(
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,padding:"9px 12px",background:"#F8FAFC",borderRadius:6,border:"1px solid #CBD5E1"}}>
        <div style={{flex:1}}>
          <div style={{fontSize:8,letterSpacing:".1em",textTransform:"uppercase",color:"#64748B",fontWeight:600,marginBottom:3}}>Assessment Confidence</div>
          <div style={{height:5,background:"#E2E8F0",borderRadius:3}}>
            <div style={{height:"100%",background:conf>=80?"#15803D":conf>=60?"#B45309":"#DC2626",borderRadius:3,width:conf+"%"}}/>
          </div>
        </div>
        <div style={{fontSize:18,fontWeight:800,color:conf>=80?"#15803D":conf>=60?"#B45309":"#DC2626"}}>{conf}%</div>
      </div>
    );
  })()}

  {/* Executive summary */}
  <div style={{fontSize:11,color:"#374151",lineHeight:1.8,marginBottom:14}}>
    <strong style={{color:"#15803D"}}>Executive Summary. </strong>
    {storeNote||`This assessment covers the proposed convenience retail operation at ${propName||"the subject site"}${postcode?`, ${postcode}`:""}.`}{" "}{commentary?.financial?.split(".")[0]}.
  </div>

  {/* What This Means */}
  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{C.roi>=20?`This site exceeds Genesis Retail's 20% investment threshold. ROI of ${pct(C.roi)} and a ${C.pb?C.pb.toFixed(1)+"-year":""} payback represent a strong commercial proposition. Subject to lease terms, this is a site worth proceeding with.`:C.roi>=10?`ROI of ${pct(C.roi)} is below the preferred 20% threshold. The site is financially viable but tight. Rent negotiation and confirmed trading uplift data are required before commitment.`:`ROI of ${pct(C.roi)} does not meet the minimum investment threshold of 10%. The current assumptions do not support a lending or investment decision. Review occupancy costs and trading projections before resubmitting.`}</div>
  </div>

  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · rshorney@genesisretail.uk · genesisretail.uk</span>
    <span>Confidential — {clientName||"Client Copy"} · Page 1</span>
  </div>
</div>

{/*──────────────────────────────────────────────────────────────
   PAGE 2 — SITE OVERVIEW
──────────────────────────────────────────────────────────────*/}
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 2</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Site Overview</div>
  </div>

  {storePhoto&&<img src={storePhoto} alt="Site" style={{width:"100%",maxHeight:170,objectFit:"cover",borderRadius:5,border:"1px solid #CBD5E1",display:"block",marginBottom:14}}/>}

  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:16}}>
    <div>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:9}}>Property Details</div>
      {[[propName,"Address"],[postcode,"Postcode"],[location||"—","Location Type"],[sqft?sqft.toLocaleString()+" sq ft":"—","Net Sales Area"],[openHours?openHours+" hrs/day":"—","Opening Hours"],[uplift?uplift+"%":"—","Post-Refit Uplift"]].filter(([v])=>v&&v!=="—").map(([v,l])=>(
        <div key={l} style={{display:"flex",borderBottom:"1px solid #F1F5F9",padding:"5px 0"}}>
          <div style={{width:140,fontSize:10,color:"#64748B",flexShrink:0}}>{l}</div>
          <div style={{fontSize:10,fontWeight:600,color:"#111827"}}>{v}</div>
        </div>
      ))}
    </div>
    <div>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:9}}>Cost Assumptions</div>
      {[[fmt(rent),"Annual Rent"],[fmt(rates),"Business Rates"],[staffPct+"%","Staff Cost %"],[fmt(utilities),"Utilities"],[fmt(otherCosts),"Other Costs"],[fmt(refitCost),"Refit Budget"],[fmt(stockCost),"Opening Stock"]].map(([v,l])=>(
        <div key={l} style={{display:"flex",borderBottom:"1px solid #F1F5F9",padding:"5px 0"}}>
          <div style={{width:140,fontSize:10,color:"#64748B",flexShrink:0}}>{l}</div>
          <div style={{fontSize:10,fontWeight:600,color:"#111827"}}>{v}</div>
        </div>
      ))}
    </div>
  </div>

  {siteVisit&&Object.values(siteVisit).some(v=>v)&&(
    <div style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:6,padding:"12px 14px",marginBottom:12}}>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:9}}>Site Visit Assessment</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:9}}>
        {[["Visibility",siteVisit.visibility],["Access",siteVisit.access],["Parking",siteVisit.parking],["Fascia",siteVisit.fascia],["Competition",siteVisit.competition]].filter(([,v])=>v).map(([l,v])=>(
          <div key={l} style={{textAlign:"center",padding:"6px 4px",background:"#F1F5F9",borderRadius:4}}>
            <div style={{fontSize:8,color:"#64748B",textTransform:"uppercase",letterSpacing:".07em",marginBottom:2}}>{l}</div>
            <div style={{fontSize:10,fontWeight:700,color:v==="Excellent"?"#15803D":v==="Good"?"#166534":v==="Poor"?"#DC2626":"#374151"}}>{v}</div>
          </div>
        ))}
      </div>
      {siteVisit.strengths&&<div style={{fontSize:10,color:"#374151",marginBottom:3}}><strong style={{color:"#15803D"}}>Strengths: </strong>{siteVisit.strengths}</div>}
      {siteVisit.weaknesses&&<div style={{fontSize:10,color:"#374151"}}><strong style={{color:"#DC2626"}}>Weaknesses: </strong>{siteVisit.weaknesses}</div>}
    </div>
  )}

  {(storeNote||postcodeNotes)&&(
    <div style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"12px 14px",marginBottom:10}}>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>Site Observations</div>
      <div style={{fontSize:11,color:"#374151",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{storeNote||postcodeNotes}</div>
    </div>
  )}

  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{`A ${location||"convenience"} format of ${sqft||"—"} sq ft${sqft>=1500?" provides strong category depth and range breadth for a symbol group conversion":sqft>=800?" is a viable convenience format, capable of supporting a full symbol group range":" is a compact format requiring disciplined category prioritisation"}. ${rent?`At ${fmt(rent)} annual rent, occupancy costs represent ${C.upliftedAnn>0?pct(rent/C.upliftedAnn*100)+" of projected post-refit turnover.":""}`:""}${postcodeNotes?" "+postcodeNotes:""}`}</div>
  </div>

  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Site Overview · Page 2</span>
  </div>
</div>

{/*──────────────────────────────────────────────────────────────
   PAGE 3 — MARKET & DEMOGRAPHICS
──────────────────────────────────────────────────────────────*/}
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 3</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Market & Catchment Demographics</div>
  </div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:9,marginBottom:18}}>
    {[[(catchmentPop||0).toLocaleString(),"Catchment Pop"],[`£${(medianIncome||0).toLocaleString()}`,"Median Income"],[`${deprivation||0}/10`,"Deprivation"],[`${DS}/9`,"Demographic Score"]].map(([v,l])=>(
      <div key={l} style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:6,padding:"12px",textAlign:"center"}}>
        <div style={{fontSize:8,letterSpacing:".1em",textTransform:"uppercase",color:"#64748B",fontWeight:600,marginBottom:4}}>{l}</div>
        <div style={{fontSize:24,fontWeight:800,color:"#15803D"}}>{v}</div>
      </div>
    ))}
  </div>

  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:16}}>
    <div>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:9}}>Age Profile</div>
      {Object.entries(ageBands||{}).map(([band,p])=>(
        <div key={band} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <div style={{width:65,fontSize:9,color:"#64748B",flexShrink:0}}>{band}</div>
          <div style={{flex:1,height:9,background:"#F1F5F9",borderRadius:3}}><div style={{height:"100%",background:"#15803D",borderRadius:3,width:p+"%"}}/></div>
          <div style={{width:26,fontSize:9,fontWeight:700,color:"#374151",textAlign:"right"}}>{p}%</div>
        </div>
      ))}
    </div>
    <div>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:9}}>Housing Tenure</div>
      {Object.entries(housing||{}).map(([k,v])=>(
        <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
          <div style={{width:110,fontSize:9,color:"#64748B",flexShrink:0}}>{k}</div>
          <div style={{flex:1,height:9,background:"#F1F5F9",borderRadius:3}}><div style={{height:"100%",background:"#15803D",borderRadius:3,width:v+"%"}}/></div>
          <div style={{width:26,fontSize:9,fontWeight:700,color:"#374151",textAlign:"right"}}>{v}%</div>
        </div>
      ))}
      <div style={{marginTop:12}}>
        <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:9}}>Employment Status</div>
        {Object.entries(employment||{}).slice(0,4).map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <div style={{width:110,fontSize:9,color:"#64748B",flexShrink:0}}>{k}</div>
            <div style={{flex:1,height:9,background:"#F1F5F9",borderRadius:3}}><div style={{height:"100%",background:"#B45309",borderRadius:3,width:v+"%"}}/></div>
            <div style={{width:26,fontSize:9,fontWeight:700,color:"#374151",textAlign:"right"}}>{v}%</div>
          </div>
        ))}
      </div>
    </div>
  </div>

  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{commentary?.demographics||areaNotes||`A catchment population of ${(catchmentPop||0).toLocaleString()} and deprivation score of ${deprivation||0}/10 indicate ${deprivation>=7?"a high-deprivation area where value, PMPs and essential grocery will over-index":deprivation>=4?"a mixed catchment requiring balanced ranging":"a lower-deprivation catchment supporting quality and premium ranging"}.`}</div>
  </div>

  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Market & Demographics · Page 3</span>
  </div>
</div>

{/*──────────────────────────────────────────────────────────────
   PAGE 4 — LOCAL FOOD PROFILE
──────────────────────────────────────────────────────────────*/}
{foodProfile&&(
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 4</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Local Food & Drink Profile</div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
    {foodProfile.summary&&<div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Catchment Food Profile</div>
      <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{foodProfile.summary}</div>
    </div>}
    {foodProfile.keyInsight&&<div style={{background:"#FFFBEB",border:"1px solid #FDE68A",borderLeft:"4px solid #B45309",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
      <div style={{fontSize:9,fontWeight:700,color:"#B45309",textTransform:"uppercase",letterSpacing:".1em",marginBottom:4}}>Key Ranging Insight</div>
      <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{foodProfile.keyInsight}</div>
    </div>}
  </div>
  {foodProfile.topFoods&&foodProfile.topFoods.length>0&&(
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:14}}>
      <thead><tr style={{background:"#F1F5F9"}}>{["Category","Index","Insight","Action"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:9,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>)}</tr></thead>
      <tbody>
        {foodProfile.topFoods.map((f,i)=>(
          <tr key={i} style={{background:i%2===0?"#fff":"#F8FAFC",borderBottom:"1px solid #CBD5E1"}}>
            <td style={{padding:"7px 10px",fontWeight:600,color:"#111827"}}>{f.category}</td>
            <td style={{padding:"7px 10px",textAlign:"center"}}><span style={{padding:"1px 7px",borderRadius:3,fontSize:9,fontWeight:700,background:f.index>=110?"#F0FDF4":f.index>=100?"#FFFBEB":"#F8FAFC",color:f.index>=110?"#15803D":f.index>=100?"#B45309":"#64748B"}}>{f.index}</span></td>
            <td style={{padding:"7px 10px",color:"#64748B",fontSize:9,maxWidth:170}}>{f.insight}</td>
            <td style={{padding:"7px 10px",color:"#374151",fontSize:9}}>{f.action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
  {foodProfile.avoidCategories?.length>0&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderLeft:"4px solid #DC2626",borderRadius:"0 6px 6px 0",padding:"9px 12px",marginBottom:10}}>
    <div style={{fontSize:8,fontWeight:700,color:"#DC2626",textTransform:"uppercase",letterSpacing:".1em",marginBottom:3}}>Avoid or Minimise</div>
    <div style={{fontSize:10,color:"#374151"}}>{foodProfile.avoidCategories.join(" · ")}</div>
  </div>}
  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{commentary?.categories||"Range to this catchment, not the national average. Prioritise the categories that over-index here."}</div>
  </div>
  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Local Food Profile · Page 4</span>
  </div>
</div>
)}

{/*──────────────────────────────────────────────────────────────
   PAGE 5 — COMPETITOR ANALYSIS
──────────────────────────────────────────────────────────────*/}
{competitorList&&competitorList.length>0&&(
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 5</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Competitor Analysis</div>
  </div>
  <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:16}}>
    <thead><tr style={{background:"#F1F5F9"}}>{["Operator","Format","Distance","Threat","Notes"].map(h=><th key={h} style={{padding:"9px 10px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:9,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>)}</tr></thead>
    <tbody>
      {competitorList.map((c,i)=>(
        <tr key={i} style={{background:i%2===0?"#fff":"#F8FAFC",borderBottom:"1px solid #CBD5E1"}}>
          <td style={{padding:"8px 10px",fontWeight:600,color:"#111827"}}>{c.name}</td>
          <td style={{padding:"8px 10px",color:"#64748B"}}>{c.type}</td>
          <td style={{padding:"8px 10px",color:"#64748B"}}>{c.distance||"—"}</td>
          <td style={{padding:"8px 10px"}}><span style={{padding:"2px 8px",borderRadius:3,fontSize:9,fontWeight:700,background:c.threat==="high"?"#FEF2F2":c.threat==="medium"?"#FFFBEB":"#F0FDF4",color:c.threat==="high"?"#DC2626":c.threat==="medium"?"#B45309":"#15803D"}}>{(c.threat||"low").toUpperCase()}</span></td>
          <td style={{padding:"8px 10px",color:"#64748B",fontSize:9}}>{c.notes||"—"}</td>
        </tr>
      ))}
    </tbody>
  </table>
  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{commentary?.competitors||`${competitorList.length} operator${competitorList.length!==1?"s":""} identified. ${competitorList.filter(c=>c.threat==="high").length} high-threat. A symbol group conversion will need to differentiate on range, fresh credentials and service.`}</div>
  </div>
  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Competitor Analysis · Page 5</span>
  </div>
</div>
)}

{/*──────────────────────────────────────────────────────────────
   PAGE 6 — SYMBOL GROUP RECOMMENDATION
──────────────────────────────────────────────────────────────*/}
{C.symGroups&&C.symGroups.length>0&&(
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 6</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Recommended Symbol Group</div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
    {C.symGroups.slice(0,3).map((sg,i)=>(
      <div key={sg.name} style={{border:`2px solid ${i===0?"#15803D":"#CBD5E1"}`,borderRadius:7,padding:"14px 14px",background:i===0?"#F0FDF4":"#fff"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <div style={{fontSize:14,fontWeight:800,color:i===0?"#15803D":"#374151"}}>{sg.name}</div>
          <div style={{fontSize:10,fontWeight:700,color:i===0?"#15803D":"#64748B"}}>{sg.score}/10</div>
        </div>
        {i===0&&<div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:5}}>★ Recommended</div>}
        <div style={{height:5,background:"#E2E8F0",borderRadius:2,marginBottom:7}}><div style={{height:"100%",background:i===0?"#15803D":"#94A3B8",borderRadius:2,width:(sg.score/10*100)+"%"}}/></div>
        <div style={{fontSize:10,color:"#64748B",lineHeight:1.5}}>{sg.desc}</div>
      </div>
    ))}
  </div>
  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{commentary?.symbolGroup||`The scoring model has ranked these options based on location type, projected turnover, catchment profile and category mix. The top-ranked group is the best fit on the assessed criteria. The final decision should involve a formal conversation with the wholesaler about terms, ranging support and refit contribution.`}</div>
  </div>
  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Symbol Group · Page 6</span>
  </div>
</div>
)}

{/*──────────────────────────────────────────────────────────────
   PAGE 7 — FINANCIAL PERFORMANCE
──────────────────────────────────────────────────────────────*/}
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 7</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Financial Performance — Year 1</div>
  </div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
    {[[fmt(C.upliftedWk),"Weekly Turnover","post-refit"],[fmt(C.upliftedAnn),"Annual Turnover",`inc. ${uplift}% uplift`],[fmt(C.annGP),"Gross Profit",pct(C.blGP)+" margin"],[fmt(C.eb),"EBITDA",pct(C.eb/C.upliftedAnn*100)+" of sales"],[fmt(C.nP),"Net Profit",pct(C.nP/C.upliftedAnn*100)+" net margin"],[pct(C.roi),"ROI",C.pb?C.pb.toFixed(1)+" yr payback":""]].map(([v,l,s])=>(
      <div key={l} style={{border:"1px solid #CBD5E1",borderRadius:6,padding:"13px 14px",borderTop:"3px solid #15803D"}}>
        <div style={{fontSize:8,letterSpacing:".1em",textTransform:"uppercase",color:"#64748B",fontWeight:600,marginBottom:3}}>{l}</div>
        <div style={{fontSize:24,fontWeight:900,color:"#111827",lineHeight:1}}>{v}</div>
        {s&&<div style={{fontSize:9,color:"#64748B",marginTop:3}}>{s}</div>}
      </div>
    ))}
  </div>
  <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:16}}>
    <thead><tr style={{background:"#F1F5F9"}}>{["","Year 1","% Sales"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:h==="Year 1"||h==="% Sales"?"right":"left",fontWeight:700,color:"#374151",fontSize:9}}>{h}</th>)}</tr></thead>
    <tbody>
      {[
        {l:"Gross Sales",v:C.upliftedAnn,b:true},
        {l:"Cost of Goods",v:-(C.upliftedAnn-C.annGP),sub:true},
        {l:"Gross Profit",v:C.annGP,b:true,hi:true,p:C.blGP},
        {l:"Staff Wages",v:-C.stf,sub:true},
        {l:"Rent",v:-rent,sub:true},
        {l:"Business Rates",v:-rates,sub:true},
        {l:"Utilities",v:-utilities,sub:true},
        {l:"Other Costs",v:-otherCosts,sub:true},
        {l:"EBITDA",v:C.eb,b:true,p:C.eb/C.upliftedAnn*100},
        {l:"Finance Charge",v:-C.af,sub:true},
        {l:"Net Profit",v:C.nP,b:true,hi:true,p:C.nP/C.upliftedAnn*100,pos:C.nP>0,neg:C.nP<=0},
      ].map(({l,v,b,sub,hi,p,pos,neg},i)=>(
        <tr key={i} style={{background:hi?(v>0?"#F0FDF4":"#FEF2F2"):b?"#F8FAFC":"#fff",borderBottom:"1px solid #CBD5E1"}}>
          <td style={{padding:"7px 10px",fontWeight:b?700:400,color:sub?"#64748B":"#374151",paddingLeft:sub?22:10,fontSize:b?10:10}}>{l}</td>
          <td style={{padding:"7px 10px",textAlign:"right",fontWeight:b?700:400,color:pos?"#15803D":neg?"#DC2626":v<0?"#DC2626":"#111827"}}>{v<0?`(${fmt(Math.abs(v))})`:fmt(v)}</td>
          <td style={{padding:"7px 10px",textAlign:"right",fontSize:9,color:"#64748B"}}>{p?pct(p):""}</td>
        </tr>
      ))}
    </tbody>
  </table>
  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{commentary?.pl||`ROI of ${pct(C.roi)} on a total investment of ${fmt(C.ti)}. Net profit of ${fmt(C.nP)} gives a payback of ${C.pb?C.pb.toFixed(1)+" years":"N/A"}.`}</div>
  </div>
  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Financial Performance · Page 7</span>
  </div>
</div>

{/*──────────────────────────────────────────────────────────────
   PAGE 8 — 5-YEAR FORECAST
──────────────────────────────────────────────────────────────*/}
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 8</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>5-Year Financial Forecast</div>
    <div style={{fontSize:10,color:"#64748B",marginTop:2}}>3% annual sales growth · 2% cost inflation</div>
  </div>
  <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:16}}>
    <thead><tr style={{background:"#F1F5F9"}}>
      <th style={{padding:"9px 10px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:9}}>Metric</th>
      {["Year 1","Year 2","Year 3","Year 4","Year 5"].map(y=><th key={y} style={{padding:"9px 10px",textAlign:"right",fontWeight:700,color:"#374151",fontSize:9}}>{y}</th>)}
    </tr></thead>
    <tbody>
      {[
        {l:"Gross Sales",key:"s"},
        {l:"Gross Profit",key:"gp",hl:true},
        {l:"Total Costs",key:"tc",neg:true},
        {l:"EBITDA",key:"eb",hl:true},
        {l:"Net Profit",key:"np",hl:true},
        {l:"Cumulative Profit",key:"cum",hl:true},
      ].map(({l,key,hl,neg},ri)=>{
        const vals=key==="cum"?[1,2,3,4,5].map(n=>cumNp(n)):yr5.map(r=>r[key]);
        return(
          <tr key={l} style={{background:hl?"#F0FDF4":ri%2===0?"#fff":"#F8FAFC",borderBottom:"1px solid #CBD5E1"}}>
            <td style={{padding:"7px 10px",fontWeight:hl?700:400,color:hl?"#15803D":"#374151",paddingLeft:hl?10:18,fontSize:hl?10:9}}>{l}</td>
            {vals.map((v,vi)=><td key={vi} style={{padding:"7px 10px",textAlign:"right",fontWeight:hl?700:400,color:hl?(v<0?"#DC2626":"#15803D"):neg?"#DC2626":"#374151",fontSize:hl?10:9}}>{v<0?`(${fmt(Math.abs(v))})`:fmt(v)}</td>)}
          </tr>
        );
      })}
    </tbody>
  </table>
  <div style={{background:"#F8FAFC",border:"1px solid #CBD5E1",borderRadius:6,padding:"12px 14px",marginBottom:14}}>
    <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Sensitivity — ROI at footfall ±20% / rent ±20%</div>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:9}}>
      <thead><tr style={{background:"#E2E8F0"}}><th style={{padding:"5px 7px",textAlign:"left",fontWeight:700,color:"#64748B",fontSize:8}}>Ftfall\Rent</th>{[-20,-10,0,10,20].map(r=><th key={r} style={{padding:"5px 7px",textAlign:"center",fontWeight:700,color:"#64748B",fontSize:8}}>{r>0?"+":""}{r}%</th>)}</tr></thead>
      <tbody>{sensitivityData&&sensitivityData.map((row,ri)=>(
        <tr key={ri} style={{borderBottom:"1px solid #E2E8F0"}}>
          <td style={{padding:"5px 7px",fontWeight:700,color:"#64748B",fontSize:8}}>{[-20,-10,0,10,20][ri]>0?"+":""}{[-20,-10,0,10,20][ri]}%</td>
          {row.map((cell,ci)=><td key={ci} style={{padding:"5px 7px",textAlign:"center",fontWeight:ri===2&&ci===2?800:600,background:ri===2&&ci===2?"#DCFCE7":cell.roi>=20?"#F0FDF4":cell.roi>=10?"#FFFBEB":"#FEF2F2",color:ri===2&&ci===2?"#15803D":cell.roi>=20?"#15803D":cell.roi>=10?"#B45309":"#DC2626",borderRadius:2,fontSize:9}}>{pct(cell.roi)}</td>)}
        </tr>
      ))}</tbody>
    </table>
  </div>
  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{commentary?.fiveYear?.split(".").slice(0,2).join(".")||`The model returns ${fmt(cumNp(5))} cumulative net profit over five years on an initial investment of ${fmt(C.ti)}.`}</div>
  </div>
  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>5-Year Forecast · Page 8</span>
  </div>
</div>

{/*──────────────────────────────────────────────────────────────
   PAGE 9 — RISK REGISTER
──────────────────────────────────────────────────────────────*/}
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",pageBreakAfter:"always",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:20}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 9</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Risk Register</div>
  </div>
  <table style={{width:"100%",borderCollapse:"collapse",fontSize:10,marginBottom:16}}>
    <thead><tr style={{background:"#F1F5F9"}}>{["Risk Factor","Rating","Detail"].map(h=><th key={h} style={{padding:"9px 10px",textAlign:"left",fontWeight:700,color:"#374151",fontSize:9,textTransform:"uppercase",letterSpacing:".06em"}}>{h}</th>)}</tr></thead>
    <tbody>
      {risks&&[...risks].sort((a,b)=>a.rag==="red"?-1:b.rag==="red"?1:a.rag==="amber"?-1:1).map((r,i)=>(
        <tr key={i} style={{background:i%2===0?"#fff":"#F8FAFC",borderBottom:"1px solid #CBD5E1"}}>
          <td style={{padding:"8px 10px",fontWeight:600,color:"#111827",width:180}}>{r.title}</td>
          <td style={{padding:"8px 10px",width:80}}><span style={{padding:"2px 9px",borderRadius:3,fontSize:9,fontWeight:700,background:r.rag==="red"?"#FEF2F2":r.rag==="amber"?"#FFFBEB":"#F0FDF4",color:r.rag==="red"?"#DC2626":r.rag==="amber"?"#B45309":"#15803D"}}>{(r.rag||"green").toUpperCase()}</span></td>
          <td style={{padding:"8px 10px",color:"#64748B",fontSize:10,lineHeight:1.5}}>{r.detail}</td>
        </tr>
      ))}
    </tbody>
  </table>
  <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderLeft:"4px solid #15803D",borderRadius:"0 6px 6px 0",padding:"11px 14px"}}>
    <div style={{fontSize:8,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".12em",marginBottom:4}}>What This Means</div>
    <div style={{fontSize:11,color:"#374151",lineHeight:1.7}}>{commentary?.risks||`${risks?.filter(r=>r.rag==="red").length||0} red risk${risks?.filter(r=>r.rag==="red").length!==1?"s":""} and ${risks?.filter(r=>r.rag==="amber").length||0} amber identified. ${risks?.filter(r=>r.rag==="red").length>2?"Material risks must be addressed before proceeding.":risks?.filter(r=>r.rag==="red").length>0?"One or more significant risks require attention before lease execution.":"Risk profile is manageable."}`}</div>
  </div>
  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Risk Register · Page 9</span>
  </div>
</div>

{/*──────────────────────────────────────────────────────────────
   PAGE 10 — INVESTMENT DECISION
──────────────────────────────────────────────────────────────*/}
<div className="slide" style={{padding:"40px 48px",minHeight:"277mm",position:"relative",background:"#fff"}}>
  <div style={{borderBottom:"2px solid #15803D",paddingBottom:9,marginBottom:22}}>
    <div style={{fontSize:8,letterSpacing:".2em",color:"#15803D",textTransform:"uppercase",fontWeight:700}}>Section 10</div>
    <div style={{fontSize:18,fontWeight:700,color:"#111827"}}>Investment Decision</div>
  </div>
  {(()=>{
    const isPass=C.roi>=20,isCaution=C.roi>=10&&C.roi<20;
    const label=isPass?"PROCEED":isCaution?"PROCEED WITH CAUTION":"DO NOT PROCEED";
    const bg=isPass?"#F0FDF4":isCaution?"#FFFBEB":"#FEF2F2";
    const col=isPass?"#15803D":isCaution?"#B45309":"#DC2626";
    return(
      <div style={{background:bg,border:`2.5px solid ${col}`,borderRadius:8,padding:"26px 30px",marginBottom:22,textAlign:"center"}}>
        <div style={{fontSize:9,letterSpacing:".22em",color:col,textTransform:"uppercase",fontWeight:700,marginBottom:7}}>Genesis Retail Recommendation</div>
        <div style={{fontSize:44,fontWeight:900,color:col,letterSpacing:"-1.5px",lineHeight:1,marginBottom:10}}>{label}</div>
        <div style={{fontSize:12,color:"#374151",maxWidth:500,margin:"0 auto",lineHeight:1.7}}>{isPass?`This site demonstrates strong commercial viability. A ${pct(C.roi)} return on investment and a ${C.pb?C.pb.toFixed(1)+"-year":""} payback meet Genesis Retail's investment threshold. Subject to lease terms and refit execution, this is a sound commercial proposition.`:isCaution?`This site shows financial viability on current assumptions but sits below the preferred 20% ROI threshold. We recommend proceeding subject to a reduction in occupancy costs or confirmation of the trading uplift assumptions through recent till data.`:`The current financial model does not support a recommendation to proceed. ROI of ${pct(C.roi)} falls below the minimum 10% threshold required for convenience retail investment. Review rent, rates and trading assumptions before resubmitting.`}</div>
      </div>
    );
  })()}
  {refitCommentary&&(
    <div style={{marginBottom:18}}>
      <div style={{fontSize:9,fontWeight:700,color:"#15803D",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Consultant Rationale</div>
      <div style={{fontSize:11,color:"#374151",lineHeight:1.85,whiteSpace:"pre-wrap"}}>{refitCommentary}</div>
    </div>
  )}
  <div style={{borderTop:"1px solid #CBD5E1",paddingTop:18,display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:16}}>
    <div>
      <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>Richard Shorney</div>
      <div style={{fontSize:10,color:"#64748B"}}>Genesis Retail Consultancy</div>
      <div style={{fontSize:10,color:"#64748B"}}>rshorney@genesisretail.uk · genesisretail.uk · 07551 827907</div>
    </div>
    <div style={{textAlign:"right",maxWidth:280}}>
      <div style={{fontSize:10,color:"#64748B"}}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</div>
      <div style={{fontSize:8,color:"#94A3B8",marginTop:4,lineHeight:1.5}}>This report is prepared on the basis of information provided by the client and publicly available data. Genesis Retail Consultancy accepts no liability for decisions made solely on the basis of this assessment without independent professional advice.</div>
    </div>
  </div>
  <div style={{position:"absolute",bottom:24,left:48,right:48,borderTop:"1px solid #CBD5E1",paddingTop:7,display:"flex",justifyContent:"space-between",fontSize:8,color:"#94A3B8"}}>
    <span>Genesis Retail · Confidential</span><span>Investment Decision · Page 10</span>
  </div>
</div>

</div>{/* end pdfRef */}
            <div style={{marginTop:32,background:"#fff",border:"2px solid "+G.mid,borderRadius:14,overflow:"hidden"}}>
              <div style={{background:"#1e3a8a",padding:"18px 24px"}}>
                <div style={{fontSize:9,letterSpacing:".25em",color:"#b45309",textTransform:"uppercase",fontWeight:700,marginBottom:4}}>Genesis Retail — Confidential</div>
                <div style={{fontSize:18,fontWeight:800,color:"#fff",lineHeight:1.2}}>{propName||"Site Assessment"}{postcode?" · "+postcode:""}</div>
                <div style={{fontSize:12,color:"#4a5568",marginTop:6}}>{new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})} · Prepared by Richard Shorney, Genesis Retail</div>
              </div>
              <div style={{padding:"24px 24px 8px"}}>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>1. Financial Performance & Investment Case</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.financial}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>2. Risk Assessment</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.risks}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>3. Competitive Environment</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.competitors}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>4. Category Mix & Margin Analysis</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.categories}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>5. Footfall & Spend Profile</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.footfall}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>6. Catchment Demographics</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.demographics}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>7. Profit & Loss</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.pl}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>8. Five-Year Outlook</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.fiveYear}</div>
                </div>

                <div style={{marginBottom:24}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:10,paddingBottom:6,borderBottom:"2px solid "+G.mid}}>9. Sensitivity & Downside Analysis</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.95}}>{commentary.sensitivity}</div>
                </div>

                <div style={{marginBottom:24,padding:"16px 20px",background:"#eef1fb",border:"1.5px solid "+G.mid,borderRadius:10}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#1e3a8a",textTransform:"uppercase",letterSpacing:".12em",marginBottom:8}}>Overall Verdict</div>
                  <div style={{fontSize:16,fontWeight:800,color:VRD.col,marginBottom:8}}>{VRD.l}</div>
                  <div style={{fontSize:14,color:"#ffffff",lineHeight:1.9}}>
                    {`This assessment concludes that ${propName||"the subject site"} ${C.roi>=20?"presents a strong investment opportunity that meets the Genesis Retail viability threshold. The financial projections are robust, the catchment is well-suited to a convenience retail offer, and the operator's existing trading history on this parade significantly de-risks the opportunity.":C.roi>=10?"is a viable investment that merits further consideration, subject to the risk factors identified in this report being addressed — in particular the rent position. The operator's knowledge of this catchment and existing customer base provide a meaningful trading advantage.":"requires further review before a recommendation to proceed can be made. The financial projections do not currently meet the Genesis Retail minimum threshold and the assumptions underlying the uplift should be stress-tested carefully with the operator before any commitment is made."}`}
                  </div>
                </div>

              </div>
              <div style={{padding:"18px 24px",background:"#1e3a8a",borderTop:"2px solid #1e3a8a"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#fef08a",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>Important Notice</div>
                <div style={{fontSize:12,color:"#e0e8ff",lineHeight:1.8}}>
                  This report has been prepared by Genesis Retail and is intended solely for the use of the named client and their appointed financial advisers. All financial projections are based on the assumptions stated within this document and are provided for indicative purposes only. Competitor and planning data is sourced from public datasets and may not reflect all operators in the catchment. Actual trading performance may differ materially from the projections contained herein. This report does not constitute financial, legal or investment advice. Genesis Retail accepts no liability for any decisions made on the basis of this assessment without independent professional verification. The contents of this report are confidential and must not be reproduced or distributed without the prior written consent of Genesis Retail.
                </div>
                <div style={{fontSize:11,color:"#8fa8d8",marginTop:10}}>© Genesis Retail {new Date().getFullYear()} · Richard Shorney · rshorney@genesisretail.uk</div>
              </div>
            </div>
          </div>
        )}

        {step<9&&(
          <div style={{display:"flex",gap:12,marginTop:16}}>
            {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{flex:1,padding:14,background:"#ffffff",border:"1.5px solid "+"#d1d9e6",borderRadius:10,color:"#1e3a8a",cursor:"pointer",fontFamily:"inherit",fontSize:15,fontWeight:600}}>Back</button>}
            <button onClick={()=>setStep(s=>s+1)} style={{flex:2,padding:14,background:"#1e3a8a",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontSize:16,fontWeight:700}}>{step===8?"View Full Report →":"Continue"}</button>
          </div>
        )}

        {/* ── ADMIN / AI AGENT ── */}
        {step===10&&<AdminTab onBack={()=>setStep(9)} appState={gatherState()}/>}
      </div>
    </div>
    </ErrorBoundary>
  );
}
