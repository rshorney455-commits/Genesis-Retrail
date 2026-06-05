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

// ── Supabase config ──────────────────────────────────────────────────────────
const SB_URL = "https://drtpeodthflxkzjgbfvu.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydHBlb2R0aGZseGt6amdiZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NDk5OTUsImV4cCI6MjA5NjIyNTk5NX0.HMr2i61gILTiVD7uPFBJP8ek_ImLgTxQj6tiBUkNzlc";
const SB_HDR = {"apikey":SB_KEY,"Authorization":"Bearer "+SB_KEY,"Content-Type":"application/json","Prefer":"return=representation"};
const sbFetch = (path, opts={}) => fetch(SB_URL+"/rest/v1/"+path, {...opts, headers:{...SB_HDR,...(opts.headers||{})}});

const sbSave = async (propName, postcode, data) => {
  try {
    const name = encodeURIComponent(propName||"draft");
    const pc = encodeURIComponent(postcode||"");
    const chk = await sbFetch(`assessments?prop_name=eq.${name}&postcode=eq.${pc}&select=id`);
    const existing = await chk.json();
    const body = JSON.stringify({prop_name:propName||"draft", postcode:postcode||"", data, updated_at:new Date().toISOString()});
    if(Array.isArray(existing) && existing.length > 0) {
      await sbFetch(`assessments?id=eq.${existing[0].id}`, {method:"PATCH", body});
    } else {
      await sbFetch("assessments", {method:"POST", body});
    }
    return true;
  } catch(e) { console.error("SB save:",e); return false; }
};

const sbLoad = async () => {
  try {
    const res = await sbFetch("assessments?select=id,prop_name,postcode,data,updated_at&order=updated_at.desc&limit=50");
    const rows = await res.json();
    if(!Array.isArray(rows)) return [];
    return rows.map(r=>({...r.data, propName:r.prop_name, postcode:r.postcode, savedAt:r.updated_at, sbId:r.id}));
  } catch(e) { console.error("SB load:",e); return []; }
};

const sbDelete = async (id) => {
  try { await sbFetch(`assessments?id=eq.${id}`, {method:"DELETE"}); return true; }
  catch(e) { return false; }
};


