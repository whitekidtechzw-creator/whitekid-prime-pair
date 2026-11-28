const Module=require('module');const orig=Module._load;
Module._load=function(r,...a){if(r==='./config')return{DATA_DIR:'./data',config:{}};if(r==='./store')return{socketCreationTime:new Map([['263700000001',Date.now()-3700000]]),getCustomPrefix:()=>'.'};return orig.call(this,r,...a)};
process.env.AUTOBIO_INTERVAL='30';
const autos=require(require('path').join(__dirname,'autos.js'));
(async()=>{let f=0;const ok=(c,m)=>{if(!c){f++;console.log('FAIL',m)}};
 const sent=[];const handlers={};
 const sock={user:{id:'263700000001:12@s.whatsapp.net'},updateProfileStatus:async t=>{sent.push(t)},ev:{on:(e,fn)=>{handlers[e]=fn}}};
 const num=autos.botNum(sock);ok(num==='263700000001','num '+num);
 ok(await autos.applyBio(sock,false)===null,'off => nothing');
 autos.setBio(num,{on:true});
 const t=await autos.applyBio(sock,false);console.log(t);
 ok(/1h 1m/.test(t)&&/\d\d:\d\d/.test(t)&&/\.menu/.test(t),'default render');
 ok(await autos.applyBio(sock,false)===null,'same text not resent');
 autos.setBio(num,{text:'{bot} {date} '+'x'.repeat(300)});
 const t2=await autos.applyBio(sock,true);ok([...t2].length===139,'trimmed '+[...t2].length);
 autos.startBio(sock);ok(typeof handlers['connection.update']==='function','close hook');handlers['connection.update']({connection:'close'});
 autos.startBio({});autos.startBio(null); // must not throw
 ok(autos.renderBio(num,'😀'.repeat(200)).length>0,'emoji ok');
 console.log(f?'AUTOBIO FAIL':'AUTOBIO TESTS PASS');process.exit(0)})();
