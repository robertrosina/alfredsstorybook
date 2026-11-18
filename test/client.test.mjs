import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import fakeGit from './mock-git.cjs';
function dom(){const elements={};function el(id){return elements[id]||(elements[id]={id,value:'',textContent:'',style:{},options:[],open:false,hidden:false,disabled:false,classList:{add(){},remove(){},toggle(){}},set innerHTML(v){this.markup=v;if(id==='detail')this.options=[...v.matchAll(/<option>(.*?)<\/option>/g)].map(m=>({value:m[1]}))},get innerHTML(){return this.markup||''},append(o){this.options.push(o)},addEventListener(){},removeAttribute(name){delete this[name]},reset(){for(const key of ['postTitle','narrative','entryDate','entryTime','detail','carer'])el(key).value=''},showModal(){this.open=true},close(){this.open=false},click(){},scrollTop:0,scrollLeft:0})}return{el,document:{getElementById:el,querySelectorAll:()=>[],querySelector:()=>null,createElement:()=>({value:'',textContent:'',click(){}}),baseURI:'https://alice.github.io/storybook/'}}}

async function setup(role){
 const html=await fs.readFile(new URL('../public/index.html',import.meta.url),'utf8');
 const code=html.split('<script>')[1].split('</script>')[0].replace('startManagedStorybook();','');
 const git=fakeGit(),ui=dom(),privateStore=new Map();
 const identity={login:'alice',role,csrf:'csrf-value',repository:{owner:'alice',repo:'storybook',branch:'main',basePath:''}};
 const fetcher=async(url,options={})=>{
  if(String(url)==='/_auth/me')return {ok:true,json:async()=>identity};
  if(String(url).startsWith('/api/github')){
   if(options.method&&options.method!=='GET')assert.equal(options.headers['X-Storybook-CSRF'],'csrf-value');
   const result=await git.fetcher('https://api.github.com/repos/alice/storybook'+String(url).slice('/api/github'.length),{...options,headers:{...options.headers,Authorization:'Bearer fake-server-only'}});
   if(String(url)==='/api/github')return{ok:true,json:async()=>({...await result.json(),private:true})};
   return result;
  }
  if(new URL(url).pathname==='/journal.json')return{ok:true,json:async()=>JSON.parse(Buffer.from(git.blobs.get(git.current['journal.json'].sha),'base64').toString()),headers:new Headers()};
  throw Error('Unexpected request '+url);
 };
 const context=vm.createContext({console,Blob,Uint8Array,URL,TextEncoder,crypto:webcrypto,setTimeout,clearTimeout,confirm:()=>true,location:{href:'https://storybook.test/',origin:'https://storybook.test',protocol:'https:',hostname:'storybook.test',pathname:'/'},document:ui.document,window:{addEventListener(){},getSelection:()=>({toString:()=>''})},localStorage:{getItem:()=>null,setItem(){}},fetch:fetcher,btoa:v=>Buffer.from(v,'binary').toString('base64'),atob:v=>Buffer.from(v,'base64').toString('binary'),privateStore});
 vm.runInContext(code,context);
 await vm.runInContext("githubLoadPrivate=async key=>privateStore.get(key)||[];githubSavePrivate=async(key,value)=>privateStore.set(key,value);",context);
 return{context,git,ui};
}
test('managed owner loads private repository and publishes a photo through the signed-in API',async()=>{
 const {context,git,ui}=await setup('admin');
 await vm.runInContext('startManagedStorybook()',context);
 assert.ok(await vm.runInContext('!!githubSession()',context),ui.el('view').innerHTML);
 await vm.runInContext('openEntry()',context);
 ui.el('postTitle').value='Uploaded through sign-in';ui.el('narrative').value='A family photograph';ui.el('entryDate').value='2026-11-18';ui.el('entryTime').value='12:30';
 await vm.runInContext("pendingPhotos=[{originalFile:new Blob([Uint8Array.from([1,2,3,4])],{type:'image/png'}),data:'data:image/png;base64,AQIDBA==',caption:'Uploaded image'}]",context);
 await ui.el('entryForm').onsubmit({preventDefault(){}});
 const journal=JSON.parse(Buffer.from(git.blobs.get(git.current['journal.json'].sha),'base64').toString());
 assert.equal(journal.entries.length,1,ui.el('photoError').textContent);
 assert.ok(git.current['media/'+journal.entries[0].photos[0].file]);
 assert.match(await vm.runInContext('entries[0].photos[0].data',context),/^https:\/\/storybook\.test\/media\//);
 assert.equal(git.requests.filter(r=>r.route==='/git/commits'&&r.method==='POST').length,1);
});
test('managed viewer entry action is blocked before opening an editor',async()=>{
 const {context,ui}=await setup('viewer');
 await vm.runInContext("storybookIdentity={login:'visitor',role:'viewer'};openEntry()",context);
 assert.equal(ui.el('entryDialog').open,false);
});
