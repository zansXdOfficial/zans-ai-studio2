import OpenAI,{toFile} from "openai";
import sharp from "sharp";
import multer from "multer";
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:20*1024*1024}});
const ai=process.env.OPENAI_API_KEY?new OpenAI({apiKey:process.env.OPENAI_API_KEY}):null;
const key=(res)=>{if(!ai){res.status(503).json({error:"Tambahkan OPENAI_API_KEY di Vercel Environment Variables."});return false}return true};
const b64=r=>r?.data?.[0]?.b64_json;
async function wm(data){
 const raw=Buffer.from(data.split(",")[1],"base64"),m=await sharp(raw).metadata(),w=m.width||1536,h=m.height||1024,fs=Math.max(28,Math.round(w*.028)),p=Math.max(28,Math.round(w*.025));
 const svg=`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><text x="${w-p}" y="${h-p}" text-anchor="end" font-family="'Matcha Mint','Brush Script MT','Segoe Script',cursive" font-size="${fs}" font-weight="600" fill="white" fill-opacity=".92" stroke="#061018" stroke-opacity=".4" stroke-width="2" paint-order="stroke">ZANE OFC</text></svg>`;
 const out=await sharp(raw).composite([{input:Buffer.from(svg)}]).png().toBuffer();return`data:image/png;base64,${out.toString("base64")}`;
}
function json(req){return new Promise((ok,bad)=>{let x="";req.on("data",c=>x+=c);req.on("end",()=>{try{ok(x?JSON.parse(x):{})}catch(e){bad(e)}})})}
export default async function handler(req,res){
 try{
  if(req.url.startsWith("/api/health"))return res.json({ok:true,configured:!!ai});
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  if(req.url.startsWith("/api/generate")){
   if(!key(res))return;let x=await json(req);if(!x.prompt?.trim())return res.status(400).json({error:"Prompt wajib diisi."});
   let r=await ai.images.generate({model:"gpt-image-2",prompt:x.prompt,size:x.size||"1536x1024",quality:x.quality||"high",output_format:"png"}),b=b64(r);return res.json({image:await wm(`data:image/png;base64,${b}`)});
  }
  if(req.url.startsWith("/api/enhance-prompt")){
   if(!key(res))return;let x=await json(req);let r=await ai.responses.create({model:"gpt-5.6",input:`Rewrite this into a detailed photorealistic image prompt in Indonesian. Preserve intent and add useful camera, lighting, composition and material details. Return only the prompt.\n${x.prompt}`});return res.json({prompt:r.output_text?.trim()||x.prompt});
  }
  if(req.url.startsWith("/api/vision-prompt")){
   if(!key(res))return;await new Promise((ok,bad)=>upload.single("image")(req,res,e=>e?bad(e):ok()));let f=req.file;if(!f)return res.status(400).json({error:"Upload foto terlebih dahulu."});
   let r=await ai.responses.create({model:"gpt-5.6",input:[{role:"user",content:[{type:"input_text",text:"Analisis foto ini dan buat satu prompt fotografi detail dalam bahasa Indonesia. Hanya jelaskan yang terlihat; jangan menebak identitas orang."},{type:"input_image",image_url:`data:${f.mimetype};base64,${f.buffer.toString("base64")}`,detail:"high"}]}]});return res.json({prompt:r.output_text?.trim()||"",provider:"OpenAI GPT-5.6"});
  }
  return res.status(404).json({error:"Endpoint tidak ditemukan"});
 }catch(e){console.error(e);return res.status(500).json({error:e.message||"Server error"})}
}