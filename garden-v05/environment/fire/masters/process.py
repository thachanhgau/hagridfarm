from PIL import Image, ImageDraw, ImageFont
import numpy as np, json, hashlib, pathlib, random
root=pathlib.Path.cwd(); out=root/'garden-v05/environment/fire'; masters=out/'masters'
N=Image.Resampling.NEAREST
palette=['231F2E','4A3042','735044','A57554','41465C','687486','A6B1AE','D6D8BF','24483F','3F6A45','71934B','B0BD67','8B4A3F','C97952','E7AE73','F5D69A','874056','C75B4B','ED8A45','FFC36B','3E3B70','6961A6','70A8B6','B7DEE0']
fire=['231F2E','4A3042','874056','C75B4B','ED8A45','FFC36B','E7AE73','F5D69A']
def quant(im,colors):
 a=np.array(im.convert('RGBA')); p=np.array([tuple(bytes.fromhex(c)) for c in colors],dtype=np.int32); rgb=a[:,:,:3].astype(np.int32)
 ix=((rgb[:,:,None,:]-p)**2).sum(3).argmin(2); a[:,:,:3]=p[ix]; a[:,:,3]=np.where(a[:,:,3]>=128,255,0); a[a[:,:,3]==0]=0
 return Image.fromarray(a)
frames={}; crops={}
def flames(id,name,w,h,intervals,y0,y1):
 im=Image.open(masters/(id+'.png')).convert('RGBA'); result=[]; maxw=max(b-a for a,b in intervals); targetw=48 if w==64 else 25
 for a,b in intervals:
  box=im.crop((a,y0,b,y1)); alpha=box.getchannel('A'); bb=alpha.point(lambda x:255 if x>=128 else 0).getbbox(); bottom=bb[3]
  box=box.crop((0,0,b-a,bottom)); tw=round((b-a)/maxw*targetw); th=round(bottom/(y1-y0)*(h-2))
  native=quant(box.resize((tw,th),N),fire); cell=Image.new('RGBA',(w,h)); cell.paste(native,((w-tw)//2,h-th)); result.append(cell)
 sheet=Image.new('RGBA',(w*len(result),h))
 for i,f in enumerate(result):sheet.paste(f,(i*w,0))
 sheet.save(out/name); frames[name]=result;crops[name]={'master':id+'.png','intervals':intervals,'vertical':[y0,y1]}
flames('large-a','flame-large.png',64,96,[(23,271),(295,543),(562,809),(833,1078),(1098,1352),(1368,1614),(1636,1884),(1907,2152)],36,679)
flames('small-a','flame-small.png',32,48,[(41,256),(286,504),(535,754),(792,995),(1048,1251),(1300,1520),(1551,1759),(1795,2010)],202,570)
im=Image.open(masters/'smoke-a.png').convert('RGBA'); result=[]
bayer=np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]])/16
for i,(a,b) in enumerate([(24,290),(361,660),(700,1022),(1066,1393),(1439,1785),(1833,2152)]):
 cell=Image.new('RGBA',(48,48)); part=im.crop((a,153,b,579)).resize((round((b-a)*46/426),46),N); cell.paste(part,((48-part.width)//2,0)); cell=quant(cell,['231F2E','4A3042','41465C','687486']); ar=np.array(cell); yy,xx=np.indices((48,48)); ar[bayer[yy%4,xx%4]>[1,.95,.85,.65,.4,.18][i]]=0; result.append(Image.fromarray(ar))
sheet=Image.new('RGBA',(288,48))
for i,f in enumerate(result):sheet.paste(f,(i*48,0))
sheet.save(out/'smoke.png');frames['smoke.png']=result;crops['smoke.png']={'master':'smoke-a.png','vertical':[153,579],'ditherCoverage':[1,.95,.85,.65,.4,.18]}
im=Image.open(masters/'scorch-a.png').convert('RGBA').crop((94,104,1680,858)).resize((64,32),N); im=quant(im,['231F2E','4A3042','735044','C75B4B','ED8A45','FFC36B']); a=np.array(im); yy,xx=np.indices((32,64)); mask=(abs((xx+.5)-32)/32+abs((yy+.5)-16)/16)<=1; a[~mask]=0; im=Image.fromarray(a);im.save(out/'scorch.png');frames['scorch.png']=[im];crops['scorch.png']={'master':'scorch-a.png','crop':[94,104,1680,858],'mask':'pixel-centre diamond abs(x-32)/32+abs(y-16)/16<=1'}
im=Image.open(masters/'banner-b.png').convert('RGBA').crop((15,17,2157,705)).resize((360,116),N);im=quant(im,palette);banner=Image.new('RGBA',(360,120));banner.paste(im,(0,4));banner.save(out/'fire-banner.png');frames['fire-banner.png']=[banner];crops['fire-banner.png']={'master':'banner-b.png','crop':[15,17,2157,705]}
# Contact sheet: every production sheet, native and nearest-neighbour 3x.
preview=Image.new('RGB',(1600,2400),'#231F2E');d=ImageDraw.Draw(preview); y=12
for name,ff in frames.items():
 sheet=Image.open(out/name); d.text((16,y),name+' | 1x above / 3x below',fill='#F5D69A');y+=20;preview.paste(sheet,(16,y),sheet);y+=sheet.height+8;big=sheet.resize((sheet.width*3,sheet.height*3),N);preview.paste(big,(16,y),big);y+=big.height+22
mock=Image.new('RGBA',(1000,470),'#3F6A45');md=ImageDraw.Draw(mock);rng=random.Random(112026)
for j in range(600):
 x=rng.randrange(1000);v=rng.randrange(470);md.line((x,v,x+2,v),fill=rng.choice(['#24483F','#71934B']))
spots=[(rng.randrange(48,952),rng.randrange(100,450)) for _ in range(40)]
for x,v in spots:mock.alpha_composite(frames['scorch.png'][0],(x-32,v-16))
for i,(x,v) in sorted(enumerate(spots),key=lambda row:row[1][1]):
 f=frames['flame-large.png' if i<20 else 'flame-small.png'][i%8];mock.alpha_composite(f,(x-f.width//2,v-f.height))
d.text((16,y),'Grass mock: exactly 20 large + 20 small flames, scorch underneath (static asset composite)',fill='#F5D69A');y+=22;preview.paste(mock,(16,y));preview.crop((0,0,1600,y+470+16)).save(root/'docs/codex-briefs/garden-fire-preview.png')
rows=json.load(open(masters/'generation-inputs.json'))
for row in rows:
 row.pop('hint',None);row['sourceGenerationPath']=row.pop('path');row['master']=row['id']+'.png';row['sha256']=hashlib.sha256((masters/row['master']).read_bytes()).hexdigest()
json.dump({'tool':'built-in image_gen','candidates':rows,'exports':crops,'processing':'native pixel nearest-neighbour sampling, palette RGB nearest colour, binary alpha; deterministic ordered smoke dithering; scorch diamond mask'},open(out/'provenance.json','w'),indent=2)
print('Exported 5 PNGs, preview and provenance')
