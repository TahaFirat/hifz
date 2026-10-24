import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import FocusPractice from '../outputs/focus-test.mjs';
const verses=[{number:1,arabic:'نص تجريبي',reading:'FIXTURE_READING_ONE',meaning:'FIXTURE_MEANING_ONE',words:[]},{number:2,arabic:'نص آخر',reading:'FIXTURE_READING_TWO',meaning:'FIXTURE_MEANING_TWO',words:[]}];
const props={verses,startNumber:1,arabic:true,reading:true,meaning:true,canSpeak:false,playing:null,challenge:false,onPlay(){},onStop(){},onExit(){},onAssess(){return true}};
test('fixture-tested: focus initially renders exactly one whole verse, and exposes navigation',()=>{
 const html=renderToStaticMarkup(React.createElement(FocusPractice,props));assert.ok(html.includes('FIXTURE_READING_ONE'));assert.ok(!html.includes('FIXTURE_READING_TWO'));assert.ok(html.includes('Sonraki'));assert.ok(html.includes('Gizle'));
});
test('fixture-tested: blind test initially contains no source text or semantic hint in the DOM',()=>{
 const html=renderToStaticMarkup(React.createElement(FocusPractice,{...props,challenge:true}));
 for(const text of ['نص تجريبي','FIXTURE_READING_ONE','FIXTURE_MEANING_ONE','Hatırladım','Takıldım','Dinle'])assert.ok(!html.includes(text),text);
 assert.ok(html.includes('Kontrol et'));assert.ok(html.includes('Ezberden oku'));
});
test('fixture-tested: focus honors the current verse and handles an empty lesson',()=>{
 const html=renderToStaticMarkup(React.createElement(FocusPractice,{...props,startNumber:2}));assert.ok(html.includes('FIXTURE_READING_TWO'));assert.ok(!html.includes('FIXTURE_READING_ONE'));assert.ok(html.includes('Bitir'));
 assert.ok(renderToStaticMarkup(React.createElement(FocusPractice,{...props,verses:[]})).includes('Çalışılacak ayet bulunamadı'));
});
