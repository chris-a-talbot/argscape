import{r as ht,j as l}from"./index-yG53otyY.js";import{S as Eo,B as bo,I as To,C as pt,V as cn,M as yt,K as it,R as Ao}from"./LessonPageHelpers-Vracst6b.js";/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Cr="176",wo=0,qr=1,Co=2,ka=1,Ro=2,en=3,vn=0,bt=1,tn=2,xn=0,Qn=1,Yr=2,$r=3,Kr=4,No=5,Pn=100,Po=101,Do=102,Lo=103,Uo=104,Io=200,Fo=201,Oo=202,Bo=203,Hs=204,ks=205,zo=206,Go=207,Ho=208,ko=209,Vo=210,jo=211,Wo=212,Xo=213,qo=214,Vs=0,js=1,Ws=2,ti=3,Xs=4,qs=5,Ys=6,$s=7,Va=0,Yo=1,$o=2,_n=0,Ko=1,Zo=2,Jo=3,Qo=4,el=5,tl=6,nl=7,ja=300,ni=301,ii=302,Ks=303,Zs=304,rs=306,Js=1e3,Ln=1001,Qs=1002,jt=1003,il=1004,wi=1005,Xt=1006,us=1007,Un=1008,an=1009,Wa=1010,Xa=1011,gi=1012,Rr=1013,In=1014,nn=1015,Mi=1016,Nr=1017,Pr=1018,xi=1020,qa=35902,Ya=1021,$a=1022,Vt=1023,_i=1026,vi=1027,Ka=1028,Dr=1029,Za=1030,Lr=1031,Ur=1033,$i=33776,Ki=33777,Zi=33778,Ji=33779,er=35840,tr=35841,nr=35842,ir=35843,sr=36196,rr=37492,ar=37496,or=37808,lr=37809,cr=37810,dr=37811,ur=37812,hr=37813,fr=37814,pr=37815,mr=37816,gr=37817,xr=37818,_r=37819,vr=37820,Mr=37821,Qi=36492,Sr=36494,yr=36495,Ja=36283,Er=36284,br=36285,Tr=36286,sl=3200,rl=3201,al=0,ol=1,gn="",It="srgb",si="srgb-linear",ns="linear",qe="srgb",Bn=7680,Zr=519,ll=512,cl=513,dl=514,Qa=515,ul=516,hl=517,fl=518,pl=519,Jr=35044,Qr="300 es",sn=2e3,is=2001;class ai{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const s=n[e];if(s!==void 0){const r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,e);e.target=null}}}const gt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],hs=Math.PI/180,Ar=180/Math.PI;function Si(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(gt[i&255]+gt[i>>8&255]+gt[i>>16&255]+gt[i>>24&255]+"-"+gt[e&255]+gt[e>>8&255]+"-"+gt[e>>16&15|64]+gt[e>>24&255]+"-"+gt[t&63|128]+gt[t>>8&255]+"-"+gt[t>>16&255]+gt[t>>24&255]+gt[n&255]+gt[n>>8&255]+gt[n>>16&255]+gt[n>>24&255]).toLowerCase()}function Ie(i,e,t){return Math.max(e,Math.min(t,i))}function ml(i,e){return(i%e+e)%e}function fs(i,e,t){return(1-t)*i+t*e}function ci(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Et(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class $e{constructor(e=0,t=0){$e.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ie(this.x,e.x,t.x),this.y=Ie(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ie(this.x,e,t),this.y=Ie(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ie(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ie(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,a=this.y-e.y;return this.x=r*n-a*s+e.x,this.y=r*s+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Pe{constructor(e,t,n,s,r,a,o,c,d){Pe.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,d)}set(e,t,n,s,r,a,o,c,d){const f=this.elements;return f[0]=e,f[1]=s,f[2]=o,f[3]=t,f[4]=r,f[5]=c,f[6]=n,f[7]=a,f[8]=d,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[3],c=n[6],d=n[1],f=n[4],p=n[7],h=n[2],m=n[5],_=n[8],S=s[0],g=s[3],u=s[6],A=s[1],T=s[4],E=s[7],D=s[2],C=s[5],w=s[8];return r[0]=a*S+o*A+c*D,r[3]=a*g+o*T+c*C,r[6]=a*u+o*E+c*w,r[1]=d*S+f*A+p*D,r[4]=d*g+f*T+p*C,r[7]=d*u+f*E+p*w,r[2]=h*S+m*A+_*D,r[5]=h*g+m*T+_*C,r[8]=h*u+m*E+_*w,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],d=e[7],f=e[8];return t*a*f-t*o*d-n*r*f+n*o*c+s*r*d-s*a*c}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],d=e[7],f=e[8],p=f*a-o*d,h=o*c-f*r,m=d*r-a*c,_=t*p+n*h+s*m;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/_;return e[0]=p*S,e[1]=(s*d-f*n)*S,e[2]=(o*n-s*a)*S,e[3]=h*S,e[4]=(f*t-s*c)*S,e[5]=(s*r-o*t)*S,e[6]=m*S,e[7]=(n*c-d*t)*S,e[8]=(a*t-n*r)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,a,o){const c=Math.cos(r),d=Math.sin(r);return this.set(n*c,n*d,-n*(c*a+d*o)+a+e,-s*d,s*c,-s*(-d*a+c*o)+o+t,0,0,1),this}scale(e,t){return this.premultiply(ps.makeScale(e,t)),this}rotate(e){return this.premultiply(ps.makeRotation(-e)),this}translate(e,t){return this.premultiply(ps.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}}const ps=new Pe;function eo(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function ss(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function gl(){const i=ss("canvas");return i.style.display="block",i}const ea={};function es(i){i in ea||(ea[i]=!0,console.warn(i))}function xl(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function _l(i){const e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function vl(i){const e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}const ta=new Pe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),na=new Pe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Ml(){const i={enabled:!0,workingColorSpace:si,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===qe&&(s.r=rn(s.r),s.g=rn(s.g),s.b=rn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===qe&&(s.r=ei(s.r),s.g=ei(s.g),s.b=ei(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===gn?ns:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[si]:{primaries:e,whitePoint:n,transfer:ns,toXYZ:ta,fromXYZ:na,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:It},outputColorSpaceConfig:{drawingBufferColorSpace:It}},[It]:{primaries:e,whitePoint:n,transfer:qe,toXYZ:ta,fromXYZ:na,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:It}}}),i}const ke=Ml();function rn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function ei(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let zn;class Sl{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{zn===void 0&&(zn=ss("canvas")),zn.width=e.width,zn.height=e.height;const s=zn.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),n=zn}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=ss("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=rn(r[a]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(rn(t[n]/255)*255):t[n]=rn(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let yl=0;class Ir{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:yl++}),this.uuid=Si(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(ms(s[a].image)):r.push(ms(s[a]))}else r=ms(s);n.url=r}return t||(e.images[this.uuid]=n),n}}function ms(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Sl.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let El=0;class Tt extends ai{constructor(e=Tt.DEFAULT_IMAGE,t=Tt.DEFAULT_MAPPING,n=Ln,s=Ln,r=Xt,a=Un,o=Vt,c=an,d=Tt.DEFAULT_ANISOTROPY,f=gn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:El++}),this.uuid=Si(),this.name="",this.source=new Ir(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=d,this.format=o,this.internalFormat=null,this.type=c,this.offset=new $e(0,0),this.repeat=new $e(1,1),this.center=new $e(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Pe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=f,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isTextureArray=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isTextureArray=e.isTextureArray,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ja)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Js:e.x=e.x-Math.floor(e.x);break;case Ln:e.x=e.x<0?0:1;break;case Qs:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Js:e.y=e.y-Math.floor(e.y);break;case Ln:e.y=e.y<0?0:1;break;case Qs:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}Tt.DEFAULT_IMAGE=null;Tt.DEFAULT_MAPPING=ja;Tt.DEFAULT_ANISOTROPY=1;class rt{constructor(e=0,t=0,n=0,s=1){rt.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*t+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*t+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*t+a[7]*n+a[11]*s+a[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r;const c=e.elements,d=c[0],f=c[4],p=c[8],h=c[1],m=c[5],_=c[9],S=c[2],g=c[6],u=c[10];if(Math.abs(f-h)<.01&&Math.abs(p-S)<.01&&Math.abs(_-g)<.01){if(Math.abs(f+h)<.1&&Math.abs(p+S)<.1&&Math.abs(_+g)<.1&&Math.abs(d+m+u-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const T=(d+1)/2,E=(m+1)/2,D=(u+1)/2,C=(f+h)/4,w=(p+S)/4,L=(_+g)/4;return T>E&&T>D?T<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(T),s=C/n,r=w/n):E>D?E<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(E),n=C/s,r=L/s):D<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(D),n=w/r,s=L/r),this.set(n,s,r,t),this}let A=Math.sqrt((g-_)*(g-_)+(p-S)*(p-S)+(h-f)*(h-f));return Math.abs(A)<.001&&(A=1),this.x=(g-_)/A,this.y=(p-S)/A,this.z=(h-f)/A,this.w=Math.acos((d+m+u-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ie(this.x,e.x,t.x),this.y=Ie(this.y,e.y,t.y),this.z=Ie(this.z,e.z,t.z),this.w=Ie(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ie(this.x,e,t),this.y=Ie(this.y,e,t),this.z=Ie(this.z,e,t),this.w=Ie(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ie(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class bl extends ai{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth?n.depth:1,this.scissor=new rt(0,0,e,t),this.scissorTest=!1,this.viewport=new rt(0,0,e,t);const s={width:e,height:t,depth:this.depth};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Xt,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1,multiview:!1},n);const r=new Tt(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];const a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const s=Object.assign({},e.textures[t].image);this.textures[t].source=new Ir(s)}return this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Fn extends bl{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class to extends Tt{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=jt,this.minFilter=jt,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Tl extends Tt{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=jt,this.minFilter=jt,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class yi{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,a,o){let c=n[s+0],d=n[s+1],f=n[s+2],p=n[s+3];const h=r[a+0],m=r[a+1],_=r[a+2],S=r[a+3];if(o===0){e[t+0]=c,e[t+1]=d,e[t+2]=f,e[t+3]=p;return}if(o===1){e[t+0]=h,e[t+1]=m,e[t+2]=_,e[t+3]=S;return}if(p!==S||c!==h||d!==m||f!==_){let g=1-o;const u=c*h+d*m+f*_+p*S,A=u>=0?1:-1,T=1-u*u;if(T>Number.EPSILON){const D=Math.sqrt(T),C=Math.atan2(D,u*A);g=Math.sin(g*C)/D,o=Math.sin(o*C)/D}const E=o*A;if(c=c*g+h*E,d=d*g+m*E,f=f*g+_*E,p=p*g+S*E,g===1-o){const D=1/Math.sqrt(c*c+d*d+f*f+p*p);c*=D,d*=D,f*=D,p*=D}}e[t]=c,e[t+1]=d,e[t+2]=f,e[t+3]=p}static multiplyQuaternionsFlat(e,t,n,s,r,a){const o=n[s],c=n[s+1],d=n[s+2],f=n[s+3],p=r[a],h=r[a+1],m=r[a+2],_=r[a+3];return e[t]=o*_+f*p+c*m-d*h,e[t+1]=c*_+f*h+d*p-o*m,e[t+2]=d*_+f*m+o*h-c*p,e[t+3]=f*_-o*p-c*h-d*m,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,s=e._y,r=e._z,a=e._order,o=Math.cos,c=Math.sin,d=o(n/2),f=o(s/2),p=o(r/2),h=c(n/2),m=c(s/2),_=c(r/2);switch(a){case"XYZ":this._x=h*f*p+d*m*_,this._y=d*m*p-h*f*_,this._z=d*f*_+h*m*p,this._w=d*f*p-h*m*_;break;case"YXZ":this._x=h*f*p+d*m*_,this._y=d*m*p-h*f*_,this._z=d*f*_-h*m*p,this._w=d*f*p+h*m*_;break;case"ZXY":this._x=h*f*p-d*m*_,this._y=d*m*p+h*f*_,this._z=d*f*_+h*m*p,this._w=d*f*p-h*m*_;break;case"ZYX":this._x=h*f*p-d*m*_,this._y=d*m*p+h*f*_,this._z=d*f*_-h*m*p,this._w=d*f*p+h*m*_;break;case"YZX":this._x=h*f*p+d*m*_,this._y=d*m*p+h*f*_,this._z=d*f*_-h*m*p,this._w=d*f*p-h*m*_;break;case"XZY":this._x=h*f*p-d*m*_,this._y=d*m*p-h*f*_,this._z=d*f*_+h*m*p,this._w=d*f*p+h*m*_;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],s=t[4],r=t[8],a=t[1],o=t[5],c=t[9],d=t[2],f=t[6],p=t[10],h=n+o+p;if(h>0){const m=.5/Math.sqrt(h+1);this._w=.25/m,this._x=(f-c)*m,this._y=(r-d)*m,this._z=(a-s)*m}else if(n>o&&n>p){const m=2*Math.sqrt(1+n-o-p);this._w=(f-c)/m,this._x=.25*m,this._y=(s+a)/m,this._z=(r+d)/m}else if(o>p){const m=2*Math.sqrt(1+o-n-p);this._w=(r-d)/m,this._x=(s+a)/m,this._y=.25*m,this._z=(c+f)/m}else{const m=2*Math.sqrt(1+p-n-o);this._w=(a-s)/m,this._x=(r+d)/m,this._y=(c+f)/m,this._z=.25*m}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ie(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,s=e._y,r=e._z,a=e._w,o=t._x,c=t._y,d=t._z,f=t._w;return this._x=n*f+a*o+s*d-r*c,this._y=s*f+a*c+r*o-n*d,this._z=r*f+a*d+n*c-s*o,this._w=a*f-n*o-s*c-r*d,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);const n=this._x,s=this._y,r=this._z,a=this._w;let o=a*e._w+n*e._x+s*e._y+r*e._z;if(o<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,o=-o):this.copy(e),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;const c=1-o*o;if(c<=Number.EPSILON){const m=1-t;return this._w=m*a+t*this._w,this._x=m*n+t*this._x,this._y=m*s+t*this._y,this._z=m*r+t*this._z,this.normalize(),this}const d=Math.sqrt(c),f=Math.atan2(d,o),p=Math.sin((1-t)*f)/d,h=Math.sin(t*f)/d;return this._w=a*p+this._w*h,this._x=n*p+this._x*h,this._y=s*p+this._y*h,this._z=r*p+this._z*h,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class O{constructor(e=0,t=0,n=0){O.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ia.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ia.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,s=this.z,r=e.elements,a=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,s=this.z,r=e.x,a=e.y,o=e.z,c=e.w,d=2*(a*s-o*n),f=2*(o*t-r*s),p=2*(r*n-a*t);return this.x=t+c*d+a*p-o*f,this.y=n+c*f+o*d-r*p,this.z=s+c*p+r*f-a*d,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ie(this.x,e.x,t.x),this.y=Ie(this.y,e.y,t.y),this.z=Ie(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ie(this.x,e,t),this.y=Ie(this.y,e,t),this.z=Ie(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ie(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,s=e.y,r=e.z,a=t.x,o=t.y,c=t.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return gs.copy(this).projectOnVector(e),this.sub(gs)}reflect(e){return this.sub(gs.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ie(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const gs=new O,ia=new yi;class Ei{constructor(e=new O(1/0,1/0,1/0),t=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(zt.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(zt.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=zt.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,zt):zt.fromBufferAttribute(r,a),zt.applyMatrix4(e.matrixWorld),this.expandByPoint(zt);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ci.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),Ci.copy(n.boundingBox)),Ci.applyMatrix4(e.matrixWorld),this.union(Ci)}const s=e.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,zt),zt.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(di),Ri.subVectors(this.max,di),Gn.subVectors(e.a,di),Hn.subVectors(e.b,di),kn.subVectors(e.c,di),dn.subVectors(Hn,Gn),un.subVectors(kn,Hn),En.subVectors(Gn,kn);let t=[0,-dn.z,dn.y,0,-un.z,un.y,0,-En.z,En.y,dn.z,0,-dn.x,un.z,0,-un.x,En.z,0,-En.x,-dn.y,dn.x,0,-un.y,un.x,0,-En.y,En.x,0];return!xs(t,Gn,Hn,kn,Ri)||(t=[1,0,0,0,1,0,0,0,1],!xs(t,Gn,Hn,kn,Ri))?!1:(Ni.crossVectors(dn,un),t=[Ni.x,Ni.y,Ni.z],xs(t,Gn,Hn,kn,Ri))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,zt).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(zt).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:($t[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),$t[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),$t[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),$t[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),$t[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),$t[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),$t[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),$t[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints($t),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}}const $t=[new O,new O,new O,new O,new O,new O,new O,new O],zt=new O,Ci=new Ei,Gn=new O,Hn=new O,kn=new O,dn=new O,un=new O,En=new O,di=new O,Ri=new O,Ni=new O,bn=new O;function xs(i,e,t,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){bn.fromArray(i,r);const o=s.x*Math.abs(bn.x)+s.y*Math.abs(bn.y)+s.z*Math.abs(bn.z),c=e.dot(bn),d=t.dot(bn),f=n.dot(bn);if(Math.max(-Math.max(c,d,f),Math.min(c,d,f))>o)return!1}return!0}const Al=new Ei,ui=new O,_s=new O;class Fr{constructor(e=new O,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Al.setFromPoints(e).getCenter(n);let s=0;for(let r=0,a=e.length;r<a;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;ui.subVectors(e,this.center);const t=ui.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(ui,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(_s.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(ui.copy(e.center).add(_s)),this.expandByPoint(ui.copy(e.center).sub(_s))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Kt=new O,vs=new O,Pi=new O,hn=new O,Ms=new O,Di=new O,Ss=new O;class wl{constructor(e=new O,t=new O(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Kt)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=Kt.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Kt.copy(this.origin).addScaledVector(this.direction,t),Kt.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){vs.copy(e).add(t).multiplyScalar(.5),Pi.copy(t).sub(e).normalize(),hn.copy(this.origin).sub(vs);const r=e.distanceTo(t)*.5,a=-this.direction.dot(Pi),o=hn.dot(this.direction),c=-hn.dot(Pi),d=hn.lengthSq(),f=Math.abs(1-a*a);let p,h,m,_;if(f>0)if(p=a*c-o,h=a*o-c,_=r*f,p>=0)if(h>=-_)if(h<=_){const S=1/f;p*=S,h*=S,m=p*(p+a*h+2*o)+h*(a*p+h+2*c)+d}else h=r,p=Math.max(0,-(a*h+o)),m=-p*p+h*(h+2*c)+d;else h=-r,p=Math.max(0,-(a*h+o)),m=-p*p+h*(h+2*c)+d;else h<=-_?(p=Math.max(0,-(-a*r+o)),h=p>0?-r:Math.min(Math.max(-r,-c),r),m=-p*p+h*(h+2*c)+d):h<=_?(p=0,h=Math.min(Math.max(-r,-c),r),m=h*(h+2*c)+d):(p=Math.max(0,-(a*r+o)),h=p>0?r:Math.min(Math.max(-r,-c),r),m=-p*p+h*(h+2*c)+d);else h=a>0?-r:r,p=Math.max(0,-(a*h+o)),m=-p*p+h*(h+2*c)+d;return n&&n.copy(this.origin).addScaledVector(this.direction,p),s&&s.copy(vs).addScaledVector(Pi,h),m}intersectSphere(e,t){Kt.subVectors(e.center,this.origin);const n=Kt.dot(this.direction),s=Kt.dot(Kt)-n*n,r=e.radius*e.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,a,o,c;const d=1/this.direction.x,f=1/this.direction.y,p=1/this.direction.z,h=this.origin;return d>=0?(n=(e.min.x-h.x)*d,s=(e.max.x-h.x)*d):(n=(e.max.x-h.x)*d,s=(e.min.x-h.x)*d),f>=0?(r=(e.min.y-h.y)*f,a=(e.max.y-h.y)*f):(r=(e.max.y-h.y)*f,a=(e.min.y-h.y)*f),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),p>=0?(o=(e.min.z-h.z)*p,c=(e.max.z-h.z)*p):(o=(e.max.z-h.z)*p,c=(e.min.z-h.z)*p),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,Kt)!==null}intersectTriangle(e,t,n,s,r){Ms.subVectors(t,e),Di.subVectors(n,e),Ss.crossVectors(Ms,Di);let a=this.direction.dot(Ss),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;hn.subVectors(this.origin,e);const c=o*this.direction.dot(Di.crossVectors(hn,Di));if(c<0)return null;const d=o*this.direction.dot(Ms.cross(hn));if(d<0||c+d>a)return null;const f=-o*hn.dot(Ss);return f<0?null:this.at(f/a,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class lt{constructor(e,t,n,s,r,a,o,c,d,f,p,h,m,_,S,g){lt.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,a,o,c,d,f,p,h,m,_,S,g)}set(e,t,n,s,r,a,o,c,d,f,p,h,m,_,S,g){const u=this.elements;return u[0]=e,u[4]=t,u[8]=n,u[12]=s,u[1]=r,u[5]=a,u[9]=o,u[13]=c,u[2]=d,u[6]=f,u[10]=p,u[14]=h,u[3]=m,u[7]=_,u[11]=S,u[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new lt().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){const t=this.elements,n=e.elements,s=1/Vn.setFromMatrixColumn(e,0).length(),r=1/Vn.setFromMatrixColumn(e,1).length(),a=1/Vn.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,s=e.y,r=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),d=Math.sin(s),f=Math.cos(r),p=Math.sin(r);if(e.order==="XYZ"){const h=a*f,m=a*p,_=o*f,S=o*p;t[0]=c*f,t[4]=-c*p,t[8]=d,t[1]=m+_*d,t[5]=h-S*d,t[9]=-o*c,t[2]=S-h*d,t[6]=_+m*d,t[10]=a*c}else if(e.order==="YXZ"){const h=c*f,m=c*p,_=d*f,S=d*p;t[0]=h+S*o,t[4]=_*o-m,t[8]=a*d,t[1]=a*p,t[5]=a*f,t[9]=-o,t[2]=m*o-_,t[6]=S+h*o,t[10]=a*c}else if(e.order==="ZXY"){const h=c*f,m=c*p,_=d*f,S=d*p;t[0]=h-S*o,t[4]=-a*p,t[8]=_+m*o,t[1]=m+_*o,t[5]=a*f,t[9]=S-h*o,t[2]=-a*d,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){const h=a*f,m=a*p,_=o*f,S=o*p;t[0]=c*f,t[4]=_*d-m,t[8]=h*d+S,t[1]=c*p,t[5]=S*d+h,t[9]=m*d-_,t[2]=-d,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){const h=a*c,m=a*d,_=o*c,S=o*d;t[0]=c*f,t[4]=S-h*p,t[8]=_*p+m,t[1]=p,t[5]=a*f,t[9]=-o*f,t[2]=-d*f,t[6]=m*p+_,t[10]=h-S*p}else if(e.order==="XZY"){const h=a*c,m=a*d,_=o*c,S=o*d;t[0]=c*f,t[4]=-p,t[8]=d*f,t[1]=h*p+S,t[5]=a*f,t[9]=m*p-_,t[2]=_*p-m,t[6]=o*f,t[10]=S*p+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Cl,e,Rl)}lookAt(e,t,n){const s=this.elements;return wt.subVectors(e,t),wt.lengthSq()===0&&(wt.z=1),wt.normalize(),fn.crossVectors(n,wt),fn.lengthSq()===0&&(Math.abs(n.z)===1?wt.x+=1e-4:wt.z+=1e-4,wt.normalize(),fn.crossVectors(n,wt)),fn.normalize(),Li.crossVectors(wt,fn),s[0]=fn.x,s[4]=Li.x,s[8]=wt.x,s[1]=fn.y,s[5]=Li.y,s[9]=wt.y,s[2]=fn.z,s[6]=Li.z,s[10]=wt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,s=t.elements,r=this.elements,a=n[0],o=n[4],c=n[8],d=n[12],f=n[1],p=n[5],h=n[9],m=n[13],_=n[2],S=n[6],g=n[10],u=n[14],A=n[3],T=n[7],E=n[11],D=n[15],C=s[0],w=s[4],L=s[8],y=s[12],M=s[1],N=s[5],H=s[9],z=s[13],j=s[2],K=s[6],W=s[10],ee=s[14],V=s[3],se=s[7],ue=s[11],_e=s[15];return r[0]=a*C+o*M+c*j+d*V,r[4]=a*w+o*N+c*K+d*se,r[8]=a*L+o*H+c*W+d*ue,r[12]=a*y+o*z+c*ee+d*_e,r[1]=f*C+p*M+h*j+m*V,r[5]=f*w+p*N+h*K+m*se,r[9]=f*L+p*H+h*W+m*ue,r[13]=f*y+p*z+h*ee+m*_e,r[2]=_*C+S*M+g*j+u*V,r[6]=_*w+S*N+g*K+u*se,r[10]=_*L+S*H+g*W+u*ue,r[14]=_*y+S*z+g*ee+u*_e,r[3]=A*C+T*M+E*j+D*V,r[7]=A*w+T*N+E*K+D*se,r[11]=A*L+T*H+E*W+D*ue,r[15]=A*y+T*z+E*ee+D*_e,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],a=e[1],o=e[5],c=e[9],d=e[13],f=e[2],p=e[6],h=e[10],m=e[14],_=e[3],S=e[7],g=e[11],u=e[15];return _*(+r*c*p-s*d*p-r*o*h+n*d*h+s*o*m-n*c*m)+S*(+t*c*m-t*d*h+r*a*h-s*a*m+s*d*f-r*c*f)+g*(+t*d*p-t*o*m-r*a*p+n*a*m+r*o*f-n*d*f)+u*(-s*o*f-t*c*p+t*o*h+s*a*p-n*a*h+n*c*f)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],a=e[4],o=e[5],c=e[6],d=e[7],f=e[8],p=e[9],h=e[10],m=e[11],_=e[12],S=e[13],g=e[14],u=e[15],A=p*g*d-S*h*d+S*c*m-o*g*m-p*c*u+o*h*u,T=_*h*d-f*g*d-_*c*m+a*g*m+f*c*u-a*h*u,E=f*S*d-_*p*d+_*o*m-a*S*m-f*o*u+a*p*u,D=_*p*c-f*S*c-_*o*h+a*S*h+f*o*g-a*p*g,C=t*A+n*T+s*E+r*D;if(C===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const w=1/C;return e[0]=A*w,e[1]=(S*h*r-p*g*r-S*s*m+n*g*m+p*s*u-n*h*u)*w,e[2]=(o*g*r-S*c*r+S*s*d-n*g*d-o*s*u+n*c*u)*w,e[3]=(p*c*r-o*h*r-p*s*d+n*h*d+o*s*m-n*c*m)*w,e[4]=T*w,e[5]=(f*g*r-_*h*r+_*s*m-t*g*m-f*s*u+t*h*u)*w,e[6]=(_*c*r-a*g*r-_*s*d+t*g*d+a*s*u-t*c*u)*w,e[7]=(a*h*r-f*c*r+f*s*d-t*h*d-a*s*m+t*c*m)*w,e[8]=E*w,e[9]=(_*p*r-f*S*r-_*n*m+t*S*m+f*n*u-t*p*u)*w,e[10]=(a*S*r-_*o*r+_*n*d-t*S*d-a*n*u+t*o*u)*w,e[11]=(f*o*r-a*p*r-f*n*d+t*p*d+a*n*m-t*o*m)*w,e[12]=D*w,e[13]=(f*S*s-_*p*s+_*n*h-t*S*h-f*n*g+t*p*g)*w,e[14]=(_*o*s-a*S*s-_*n*c+t*S*c+a*n*g-t*o*g)*w,e[15]=(a*p*s-f*o*s+f*n*c-t*p*c-a*n*h+t*o*h)*w,this}scale(e){const t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),s=Math.sin(t),r=1-n,a=e.x,o=e.y,c=e.z,d=r*a,f=r*o;return this.set(d*a+n,d*o-s*c,d*c+s*o,0,d*o+s*c,f*o+n,f*c-s*a,0,d*c-s*o,f*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,a){return this.set(1,n,r,0,e,1,a,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){const s=this.elements,r=t._x,a=t._y,o=t._z,c=t._w,d=r+r,f=a+a,p=o+o,h=r*d,m=r*f,_=r*p,S=a*f,g=a*p,u=o*p,A=c*d,T=c*f,E=c*p,D=n.x,C=n.y,w=n.z;return s[0]=(1-(S+u))*D,s[1]=(m+E)*D,s[2]=(_-T)*D,s[3]=0,s[4]=(m-E)*C,s[5]=(1-(h+u))*C,s[6]=(g+A)*C,s[7]=0,s[8]=(_+T)*w,s[9]=(g-A)*w,s[10]=(1-(h+S))*w,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){const s=this.elements;let r=Vn.set(s[0],s[1],s[2]).length();const a=Vn.set(s[4],s[5],s[6]).length(),o=Vn.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Gt.copy(this);const d=1/r,f=1/a,p=1/o;return Gt.elements[0]*=d,Gt.elements[1]*=d,Gt.elements[2]*=d,Gt.elements[4]*=f,Gt.elements[5]*=f,Gt.elements[6]*=f,Gt.elements[8]*=p,Gt.elements[9]*=p,Gt.elements[10]*=p,t.setFromRotationMatrix(Gt),n.x=r,n.y=a,n.z=o,this}makePerspective(e,t,n,s,r,a,o=sn){const c=this.elements,d=2*r/(t-e),f=2*r/(n-s),p=(t+e)/(t-e),h=(n+s)/(n-s);let m,_;if(o===sn)m=-(a+r)/(a-r),_=-2*a*r/(a-r);else if(o===is)m=-a/(a-r),_=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=d,c[4]=0,c[8]=p,c[12]=0,c[1]=0,c[5]=f,c[9]=h,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=_,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,a,o=sn){const c=this.elements,d=1/(t-e),f=1/(n-s),p=1/(a-r),h=(t+e)*d,m=(n+s)*f;let _,S;if(o===sn)_=(a+r)*p,S=-2*p;else if(o===is)_=r*p,S=-1*p;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=2*d,c[4]=0,c[8]=0,c[12]=-h,c[1]=0,c[5]=2*f,c[9]=0,c[13]=-m,c[2]=0,c[6]=0,c[10]=S,c[14]=-_,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}}const Vn=new O,Gt=new lt,Cl=new O(0,0,0),Rl=new O(1,1,1),fn=new O,Li=new O,wt=new O,sa=new lt,ra=new yi;class on{constructor(e=0,t=0,n=0,s=on.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const s=e.elements,r=s[0],a=s[4],o=s[8],c=s[1],d=s[5],f=s[9],p=s[2],h=s[6],m=s[10];switch(t){case"XYZ":this._y=Math.asin(Ie(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-f,m),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,d),this._z=0);break;case"YXZ":this._x=Math.asin(-Ie(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(o,m),this._z=Math.atan2(c,d)):(this._y=Math.atan2(-p,r),this._z=0);break;case"ZXY":this._x=Math.asin(Ie(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-p,m),this._z=Math.atan2(-a,d)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Ie(p,-1,1)),Math.abs(p)<.9999999?(this._x=Math.atan2(h,m),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,d));break;case"YZX":this._z=Math.asin(Ie(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-f,d),this._y=Math.atan2(-p,r)):(this._x=0,this._y=Math.atan2(o,m));break;case"XZY":this._z=Math.asin(-Ie(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,d),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-f,m),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return sa.makeRotationFromQuaternion(e),this.setFromRotationMatrix(sa,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ra.setFromEuler(this),this.setFromQuaternion(ra,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}on.DEFAULT_ORDER="XYZ";class no{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let Nl=0;const aa=new O,jn=new yi,Zt=new lt,Ui=new O,hi=new O,Pl=new O,Dl=new yi,oa=new O(1,0,0),la=new O(0,1,0),ca=new O(0,0,1),da={type:"added"},Ll={type:"removed"},Wn={type:"childadded",child:null},ys={type:"childremoved",child:null};class _t extends ai{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Nl++}),this.uuid=Si(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=_t.DEFAULT_UP.clone();const e=new O,t=new on,n=new yi,s=new O(1,1,1);function r(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new lt},normalMatrix:{value:new Pe}}),this.matrix=new lt,this.matrixWorld=new lt,this.matrixAutoUpdate=_t.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=_t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new no,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return jn.setFromAxisAngle(e,t),this.quaternion.multiply(jn),this}rotateOnWorldAxis(e,t){return jn.setFromAxisAngle(e,t),this.quaternion.premultiply(jn),this}rotateX(e){return this.rotateOnAxis(oa,e)}rotateY(e){return this.rotateOnAxis(la,e)}rotateZ(e){return this.rotateOnAxis(ca,e)}translateOnAxis(e,t){return aa.copy(e).applyQuaternion(this.quaternion),this.position.add(aa.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(oa,e)}translateY(e){return this.translateOnAxis(la,e)}translateZ(e){return this.translateOnAxis(ca,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Zt.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ui.copy(e):Ui.set(e,t,n);const s=this.parent;this.updateWorldMatrix(!0,!1),hi.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zt.lookAt(hi,Ui,this.up):Zt.lookAt(Ui,hi,this.up),this.quaternion.setFromRotationMatrix(Zt),s&&(Zt.extractRotation(s.matrixWorld),jn.setFromRotationMatrix(Zt),this.quaternion.premultiply(jn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(da),Wn.child=e,this.dispatchEvent(Wn),Wn.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Ll),ys.child=e,this.dispatchEvent(ys),ys.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Zt.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Zt.multiply(e.parent.matrixWorld)),e.applyMatrix4(Zt),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(da),Wn.child=e,this.dispatchEvent(Wn),Wn.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hi,e,Pl),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(hi,Dl,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){const n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?{min:o.boundingBox.min.toArray(),max:o.boundingBox.max.toArray()}:void 0,boundingSphere:o.boundingSphere?{radius:o.boundingSphere.radius,center:o.boundingSphere.center.toArray()}:void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:this.boundingSphere.center.toArray(),radius:this.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:this.boundingBox.min.toArray(),max:this.boundingBox.max.toArray()}));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let d=0,f=c.length;d<f;d++){const p=c[d];r(e.shapes,p)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,d=this.material.length;c<d;c++)o.push(r(e.materials,this.material[c]));s.material=o}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];s.animations.push(r(e.animations,c))}}if(t){const o=a(e.geometries),c=a(e.materials),d=a(e.textures),f=a(e.images),p=a(e.shapes),h=a(e.skeletons),m=a(e.animations),_=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),d.length>0&&(n.textures=d),f.length>0&&(n.images=f),p.length>0&&(n.shapes=p),h.length>0&&(n.skeletons=h),m.length>0&&(n.animations=m),_.length>0&&(n.nodes=_)}return n.object=s,n;function a(o){const c=[];for(const d in o){const f=o[d];delete f.metadata,c.push(f)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const s=e.children[n];this.add(s.clone())}return this}}_t.DEFAULT_UP=new O(0,1,0);_t.DEFAULT_MATRIX_AUTO_UPDATE=!0;_t.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Ht=new O,Jt=new O,Es=new O,Qt=new O,Xn=new O,qn=new O,ua=new O,bs=new O,Ts=new O,As=new O,ws=new rt,Cs=new rt,Rs=new rt;class kt{constructor(e=new O,t=new O,n=new O){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Ht.subVectors(e,t),s.cross(Ht);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Ht.subVectors(s,t),Jt.subVectors(n,t),Es.subVectors(e,t);const a=Ht.dot(Ht),o=Ht.dot(Jt),c=Ht.dot(Es),d=Jt.dot(Jt),f=Jt.dot(Es),p=a*d-o*o;if(p===0)return r.set(0,0,0),null;const h=1/p,m=(d*c-o*f)*h,_=(a*f-o*c)*h;return r.set(1-m-_,_,m)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,Qt)===null?!1:Qt.x>=0&&Qt.y>=0&&Qt.x+Qt.y<=1}static getInterpolation(e,t,n,s,r,a,o,c){return this.getBarycoord(e,t,n,s,Qt)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,Qt.x),c.addScaledVector(a,Qt.y),c.addScaledVector(o,Qt.z),c)}static getInterpolatedAttribute(e,t,n,s,r,a){return ws.setScalar(0),Cs.setScalar(0),Rs.setScalar(0),ws.fromBufferAttribute(e,t),Cs.fromBufferAttribute(e,n),Rs.fromBufferAttribute(e,s),a.setScalar(0),a.addScaledVector(ws,r.x),a.addScaledVector(Cs,r.y),a.addScaledVector(Rs,r.z),a}static isFrontFacing(e,t,n,s){return Ht.subVectors(n,t),Jt.subVectors(e,t),Ht.cross(Jt).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ht.subVectors(this.c,this.b),Jt.subVectors(this.a,this.b),Ht.cross(Jt).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return kt.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return kt.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return kt.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return kt.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return kt.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,s=this.b,r=this.c;let a,o;Xn.subVectors(s,n),qn.subVectors(r,n),bs.subVectors(e,n);const c=Xn.dot(bs),d=qn.dot(bs);if(c<=0&&d<=0)return t.copy(n);Ts.subVectors(e,s);const f=Xn.dot(Ts),p=qn.dot(Ts);if(f>=0&&p<=f)return t.copy(s);const h=c*p-f*d;if(h<=0&&c>=0&&f<=0)return a=c/(c-f),t.copy(n).addScaledVector(Xn,a);As.subVectors(e,r);const m=Xn.dot(As),_=qn.dot(As);if(_>=0&&m<=_)return t.copy(r);const S=m*d-c*_;if(S<=0&&d>=0&&_<=0)return o=d/(d-_),t.copy(n).addScaledVector(qn,o);const g=f*_-m*p;if(g<=0&&p-f>=0&&m-_>=0)return ua.subVectors(r,s),o=(p-f)/(p-f+(m-_)),t.copy(s).addScaledVector(ua,o);const u=1/(g+S+h);return a=S*u,o=h*u,t.copy(n).addScaledVector(Xn,a).addScaledVector(qn,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}const io={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},pn={h:0,s:0,l:0},Ii={h:0,s:0,l:0};function Ns(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class Ye{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=It){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ke.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=ke.workingColorSpace){return this.r=e,this.g=t,this.b=n,ke.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=ke.workingColorSpace){if(e=ml(e,1),t=Ie(t,0,1),n=Ie(n,0,1),t===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+t):n+t-n*t,a=2*n-r;this.r=Ns(a,r,e+1/3),this.g=Ns(a,r,e),this.b=Ns(a,r,e-1/3)}return ke.toWorkingColorSpace(this,s),this}setStyle(e,t=It){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=It){const n=io[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=rn(e.r),this.g=rn(e.g),this.b=rn(e.b),this}copyLinearToSRGB(e){return this.r=ei(e.r),this.g=ei(e.g),this.b=ei(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=It){return ke.fromWorkingColorSpace(xt.copy(this),e),Math.round(Ie(xt.r*255,0,255))*65536+Math.round(Ie(xt.g*255,0,255))*256+Math.round(Ie(xt.b*255,0,255))}getHexString(e=It){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ke.workingColorSpace){ke.fromWorkingColorSpace(xt.copy(this),t);const n=xt.r,s=xt.g,r=xt.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let c,d;const f=(o+a)/2;if(o===a)c=0,d=0;else{const p=a-o;switch(d=f<=.5?p/(a+o):p/(2-a-o),a){case n:c=(s-r)/p+(s<r?6:0);break;case s:c=(r-n)/p+2;break;case r:c=(n-s)/p+4;break}c/=6}return e.h=c,e.s=d,e.l=f,e}getRGB(e,t=ke.workingColorSpace){return ke.fromWorkingColorSpace(xt.copy(this),t),e.r=xt.r,e.g=xt.g,e.b=xt.b,e}getStyle(e=It){ke.fromWorkingColorSpace(xt.copy(this),e);const t=xt.r,n=xt.g,s=xt.b;return e!==It?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(pn),this.setHSL(pn.h+e,pn.s+t,pn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(pn),e.getHSL(Ii);const n=fs(pn.h,Ii.h,t),s=fs(pn.s,Ii.s,t),r=fs(pn.l,Ii.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const xt=new Ye;Ye.NAMES=io;let Ul=0;class as extends ai{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Ul++}),this.uuid=Si(),this.name="",this.type="Material",this.blending=Qn,this.side=vn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Hs,this.blendDst=ks,this.blendEquation=Pn,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ye(0,0,0),this.blendAlpha=0,this.depthFunc=ti,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Zr,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Bn,this.stencilZFail=Bn,this.stencilZPass=Bn,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==Qn&&(n.blending=this.blending),this.side!==vn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Hs&&(n.blendSrc=this.blendSrc),this.blendDst!==ks&&(n.blendDst=this.blendDst),this.blendEquation!==Pn&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==ti&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Zr&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Bn&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Bn&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Bn&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(t){const r=s(e.textures),a=s(e.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}class mi extends as{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ye(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new on,this.combine=Va,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const ot=new O,Fi=new $e;let Il=0;class qt{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Il++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=Jr,this.updateRanges=[],this.gpuType=nn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)Fi.fromBufferAttribute(this,t),Fi.applyMatrix3(e),this.setXY(t,Fi.x,Fi.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.applyMatrix3(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.applyMatrix4(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.applyNormalMatrix(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)ot.fromBufferAttribute(this,t),ot.transformDirection(e),this.setXYZ(t,ot.x,ot.y,ot.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=ci(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=Et(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ci(t,this.array)),t}setX(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ci(t,this.array)),t}setY(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ci(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ci(t,this.array)),t}setW(e,t){return this.normalized&&(t=Et(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array),s=Et(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=Et(t,this.array),n=Et(n,this.array),s=Et(s,this.array),r=Et(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==Jr&&(e.usage=this.usage),e}}class so extends qt{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class ro extends qt{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Nt extends qt{constructor(e,t,n){super(new Float32Array(e),t,n)}}let Fl=0;const Ut=new lt,Ps=new _t,Yn=new O,Ct=new Ei,fi=new Ei,ut=new O;class ln extends ai{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Fl++}),this.uuid=Si(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(eo(e)?ro:so)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new Pe().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return Ut.makeRotationFromQuaternion(e),this.applyMatrix4(Ut),this}rotateX(e){return Ut.makeRotationX(e),this.applyMatrix4(Ut),this}rotateY(e){return Ut.makeRotationY(e),this.applyMatrix4(Ut),this}rotateZ(e){return Ut.makeRotationZ(e),this.applyMatrix4(Ut),this}translate(e,t,n){return Ut.makeTranslation(e,t,n),this.applyMatrix4(Ut),this}scale(e,t,n){return Ut.makeScale(e,t,n),this.applyMatrix4(Ut),this}lookAt(e){return Ps.lookAt(e),Ps.updateMatrix(),this.applyMatrix4(Ps.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Yn).negate(),this.translate(Yn.x,Yn.y,Yn.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let s=0,r=e.length;s<r;s++){const a=e[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Nt(n,3))}else{const n=Math.min(e.length,t.count);for(let s=0;s<n;s++){const r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ei);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){const r=t[n];Ct.setFromBufferAttribute(r),this.morphTargetsRelative?(ut.addVectors(this.boundingBox.min,Ct.min),this.boundingBox.expandByPoint(ut),ut.addVectors(this.boundingBox.max,Ct.max),this.boundingBox.expandByPoint(ut)):(this.boundingBox.expandByPoint(Ct.min),this.boundingBox.expandByPoint(Ct.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Fr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(e){const n=this.boundingSphere.center;if(Ct.setFromBufferAttribute(e),t)for(let r=0,a=t.length;r<a;r++){const o=t[r];fi.setFromBufferAttribute(o),this.morphTargetsRelative?(ut.addVectors(Ct.min,fi.min),Ct.expandByPoint(ut),ut.addVectors(Ct.max,fi.max),Ct.expandByPoint(ut)):(Ct.expandByPoint(fi.min),Ct.expandByPoint(fi.max))}Ct.getCenter(n);let s=0;for(let r=0,a=e.count;r<a;r++)ut.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(ut));if(t)for(let r=0,a=t.length;r<a;r++){const o=t[r],c=this.morphTargetsRelative;for(let d=0,f=o.count;d<f;d++)ut.fromBufferAttribute(o,d),c&&(Yn.fromBufferAttribute(e,d),ut.add(Yn)),s=Math.max(s,n.distanceToSquared(ut))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new qt(new Float32Array(4*n.count),4));const a=this.getAttribute("tangent"),o=[],c=[];for(let L=0;L<n.count;L++)o[L]=new O,c[L]=new O;const d=new O,f=new O,p=new O,h=new $e,m=new $e,_=new $e,S=new O,g=new O;function u(L,y,M){d.fromBufferAttribute(n,L),f.fromBufferAttribute(n,y),p.fromBufferAttribute(n,M),h.fromBufferAttribute(r,L),m.fromBufferAttribute(r,y),_.fromBufferAttribute(r,M),f.sub(d),p.sub(d),m.sub(h),_.sub(h);const N=1/(m.x*_.y-_.x*m.y);isFinite(N)&&(S.copy(f).multiplyScalar(_.y).addScaledVector(p,-m.y).multiplyScalar(N),g.copy(p).multiplyScalar(m.x).addScaledVector(f,-_.x).multiplyScalar(N),o[L].add(S),o[y].add(S),o[M].add(S),c[L].add(g),c[y].add(g),c[M].add(g))}let A=this.groups;A.length===0&&(A=[{start:0,count:e.count}]);for(let L=0,y=A.length;L<y;++L){const M=A[L],N=M.start,H=M.count;for(let z=N,j=N+H;z<j;z+=3)u(e.getX(z+0),e.getX(z+1),e.getX(z+2))}const T=new O,E=new O,D=new O,C=new O;function w(L){D.fromBufferAttribute(s,L),C.copy(D);const y=o[L];T.copy(y),T.sub(D.multiplyScalar(D.dot(y))).normalize(),E.crossVectors(C,y);const N=E.dot(c[L])<0?-1:1;a.setXYZW(L,T.x,T.y,T.z,N)}for(let L=0,y=A.length;L<y;++L){const M=A[L],N=M.start,H=M.count;for(let z=N,j=N+H;z<j;z+=3)w(e.getX(z+0)),w(e.getX(z+1)),w(e.getX(z+2))}}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new qt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let h=0,m=n.count;h<m;h++)n.setXYZ(h,0,0,0);const s=new O,r=new O,a=new O,o=new O,c=new O,d=new O,f=new O,p=new O;if(e)for(let h=0,m=e.count;h<m;h+=3){const _=e.getX(h+0),S=e.getX(h+1),g=e.getX(h+2);s.fromBufferAttribute(t,_),r.fromBufferAttribute(t,S),a.fromBufferAttribute(t,g),f.subVectors(a,r),p.subVectors(s,r),f.cross(p),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,S),d.fromBufferAttribute(n,g),o.add(f),c.add(f),d.add(f),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(S,c.x,c.y,c.z),n.setXYZ(g,d.x,d.y,d.z)}else for(let h=0,m=t.count;h<m;h+=3)s.fromBufferAttribute(t,h+0),r.fromBufferAttribute(t,h+1),a.fromBufferAttribute(t,h+2),f.subVectors(a,r),p.subVectors(s,r),f.cross(p),n.setXYZ(h+0,f.x,f.y,f.z),n.setXYZ(h+1,f.x,f.y,f.z),n.setXYZ(h+2,f.x,f.y,f.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)ut.fromBufferAttribute(e,t),ut.normalize(),e.setXYZ(t,ut.x,ut.y,ut.z)}toNonIndexed(){function e(o,c){const d=o.array,f=o.itemSize,p=o.normalized,h=new d.constructor(c.length*f);let m=0,_=0;for(let S=0,g=c.length;S<g;S++){o.isInterleavedBufferAttribute?m=c[S]*o.data.stride+o.offset:m=c[S]*f;for(let u=0;u<f;u++)h[_++]=d[m++]}return new qt(h,f,p)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new ln,n=this.index.array,s=this.attributes;for(const o in s){const c=s[o],d=e(c,n);t.setAttribute(o,d)}const r=this.morphAttributes;for(const o in r){const c=[],d=r[o];for(let f=0,p=d.length;f<p;f++){const h=d[f],m=e(h,n);c.push(m)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const d=a[o];t.addGroup(d.start,d.count,d.materialIndex)}return t}toJSON(){const e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){const c=this.parameters;for(const d in c)c[d]!==void 0&&(e[d]=c[d]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const d=n[c];e.data.attributes[c]=d.toJSON(e.data)}const s={};let r=!1;for(const c in this.morphAttributes){const d=this.morphAttributes[c],f=[];for(let p=0,h=d.length;p<h;p++){const m=d[p];f.push(m.toJSON(e.data))}f.length>0&&(s[c]=f,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const s=e.attributes;for(const d in s){const f=s[d];this.setAttribute(d,f.clone(t))}const r=e.morphAttributes;for(const d in r){const f=[],p=r[d];for(let h=0,m=p.length;h<m;h++)f.push(p[h].clone(t));this.morphAttributes[d]=f}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let d=0,f=a.length;d<f;d++){const p=a[d];this.addGroup(p.start,p.count,p.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const ha=new lt,Tn=new wl,Oi=new Fr,fa=new O,Bi=new O,zi=new O,Gi=new O,Ds=new O,Hi=new O,pa=new O,ki=new O;class Rt extends _t{constructor(e=new ln,t=new mi){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(e,t){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(s,e);const o=this.morphTargetInfluences;if(r&&o){Hi.set(0,0,0);for(let c=0,d=r.length;c<d;c++){const f=o[c],p=r[c];f!==0&&(Ds.fromBufferAttribute(p,e),a?Hi.addScaledVector(Ds,f):Hi.addScaledVector(Ds.sub(t),f))}t.add(Hi)}return t}raycast(e,t){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Oi.copy(n.boundingSphere),Oi.applyMatrix4(r),Tn.copy(e.ray).recast(e.near),!(Oi.containsPoint(Tn.origin)===!1&&(Tn.intersectSphere(Oi,fa)===null||Tn.origin.distanceToSquared(fa)>(e.far-e.near)**2))&&(ha.copy(r).invert(),Tn.copy(e.ray).applyMatrix4(ha),!(n.boundingBox!==null&&Tn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Tn)))}_computeIntersections(e,t,n){let s;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,d=r.attributes.uv,f=r.attributes.uv1,p=r.attributes.normal,h=r.groups,m=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,S=h.length;_<S;_++){const g=h[_],u=a[g.materialIndex],A=Math.max(g.start,m.start),T=Math.min(o.count,Math.min(g.start+g.count,m.start+m.count));for(let E=A,D=T;E<D;E+=3){const C=o.getX(E),w=o.getX(E+1),L=o.getX(E+2);s=Vi(this,u,e,n,d,f,p,C,w,L),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{const _=Math.max(0,m.start),S=Math.min(o.count,m.start+m.count);for(let g=_,u=S;g<u;g+=3){const A=o.getX(g),T=o.getX(g+1),E=o.getX(g+2);s=Vi(this,a,e,n,d,f,p,A,T,E),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,S=h.length;_<S;_++){const g=h[_],u=a[g.materialIndex],A=Math.max(g.start,m.start),T=Math.min(c.count,Math.min(g.start+g.count,m.start+m.count));for(let E=A,D=T;E<D;E+=3){const C=E,w=E+1,L=E+2;s=Vi(this,u,e,n,d,f,p,C,w,L),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=g.materialIndex,t.push(s))}}else{const _=Math.max(0,m.start),S=Math.min(c.count,m.start+m.count);for(let g=_,u=S;g<u;g+=3){const A=g,T=g+1,E=g+2;s=Vi(this,a,e,n,d,f,p,A,T,E),s&&(s.faceIndex=Math.floor(g/3),t.push(s))}}}}function Ol(i,e,t,n,s,r,a,o){let c;if(e.side===bt?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,e.side===vn,o),c===null)return null;ki.copy(o),ki.applyMatrix4(i.matrixWorld);const d=t.ray.origin.distanceTo(ki);return d<t.near||d>t.far?null:{distance:d,point:ki.clone(),object:i}}function Vi(i,e,t,n,s,r,a,o,c,d){i.getVertexPosition(o,Bi),i.getVertexPosition(c,zi),i.getVertexPosition(d,Gi);const f=Ol(i,e,t,n,Bi,zi,Gi,pa);if(f){const p=new O;kt.getBarycoord(pa,Bi,zi,Gi,p),s&&(f.uv=kt.getInterpolatedAttribute(s,o,c,d,p,new $e)),r&&(f.uv1=kt.getInterpolatedAttribute(r,o,c,d,p,new $e)),a&&(f.normal=kt.getInterpolatedAttribute(a,o,c,d,p,new O),f.normal.dot(n.direction)>0&&f.normal.multiplyScalar(-1));const h={a:o,b:c,c:d,normal:new O,materialIndex:0};kt.getNormal(Bi,zi,Gi,h.normal),f.face=h,f.barycoord=p}return f}class bi extends ln{constructor(e=1,t=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const c=[],d=[],f=[],p=[];let h=0,m=0;_("z","y","x",-1,-1,n,t,e,a,r,0),_("z","y","x",1,-1,n,t,-e,a,r,1),_("x","z","y",1,1,e,n,t,s,a,2),_("x","z","y",1,-1,e,n,-t,s,a,3),_("x","y","z",1,-1,e,t,n,s,r,4),_("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Nt(d,3)),this.setAttribute("normal",new Nt(f,3)),this.setAttribute("uv",new Nt(p,2));function _(S,g,u,A,T,E,D,C,w,L,y){const M=E/w,N=D/L,H=E/2,z=D/2,j=C/2,K=w+1,W=L+1;let ee=0,V=0;const se=new O;for(let ue=0;ue<W;ue++){const _e=ue*N-z;for(let Ue=0;Ue<K;Ue++){const Ke=Ue*M-H;se[S]=Ke*A,se[g]=_e*T,se[u]=j,d.push(se.x,se.y,se.z),se[S]=0,se[g]=0,se[u]=C>0?1:-1,f.push(se.x,se.y,se.z),p.push(Ue/w),p.push(1-ue/L),ee+=1}}for(let ue=0;ue<L;ue++)for(let _e=0;_e<w;_e++){const Ue=h+_e+K*ue,Ke=h+_e+K*(ue+1),q=h+(_e+1)+K*(ue+1),te=h+(_e+1)+K*ue;c.push(Ue,Ke,te),c.push(Ke,q,te),V+=6}o.addGroup(m,V,y),m+=V,h+=ee}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new bi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}function ri(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Mt(i){const e={};for(let t=0;t<i.length;t++){const n=ri(i[t]);for(const s in n)e[s]=n[s]}return e}function Bl(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function ao(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ke.workingColorSpace}const zl={clone:ri,merge:Mt};var Gl=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Hl=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class Mn extends as{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Gl,this.fragmentShader=Hl,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=ri(e.uniforms),this.uniformsGroups=Bl(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?t.uniforms[s]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[s]={type:"m4",value:a.toArray()}:t.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}}class oo extends _t{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new lt,this.projectionMatrix=new lt,this.projectionMatrixInverse=new lt,this.coordinateSystem=sn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}const mn=new O,ma=new $e,ga=new $e;class Ft extends oo{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=Ar*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(hs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return Ar*2*Math.atan(Math.tan(hs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){mn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(mn.x,mn.y).multiplyScalar(-e/mn.z),mn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(mn.x,mn.y).multiplyScalar(-e/mn.z)}getViewSize(e,t){return this.getViewBounds(e,ma,ga),t.subVectors(ga,ma)}setViewOffset(e,t,n,s,r,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(hs*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,d=a.fullHeight;r+=a.offsetX*s/c,t-=a.offsetY*n/d,s*=a.width/c,n*=a.height/d}const o=this.filmOffset;o!==0&&(r+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const $n=-90,Kn=1;class kl extends _t{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Ft($n,Kn,e,t);s.layers=this.layers,this.add(s);const r=new Ft($n,Kn,e,t);r.layers=this.layers,this.add(r);const a=new Ft($n,Kn,e,t);a.layers=this.layers,this.add(a);const o=new Ft($n,Kn,e,t);o.layers=this.layers,this.add(o);const c=new Ft($n,Kn,e,t);c.layers=this.layers,this.add(c);const d=new Ft($n,Kn,e,t);d.layers=this.layers,this.add(d)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,s,r,a,o,c]=t;for(const d of t)this.remove(d);if(e===sn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===is)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const d of t)this.add(d),d.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,d,f]=this.children,p=e.getRenderTarget(),h=e.getActiveCubeFace(),m=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,a),e.setRenderTarget(n,2,s),e.render(t,o),e.setRenderTarget(n,3,s),e.render(t,c),e.setRenderTarget(n,4,s),e.render(t,d),n.texture.generateMipmaps=S,e.setRenderTarget(n,5,s),e.render(t,f),e.setRenderTarget(p,h,m),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class lo extends Tt{constructor(e=[],t=ni,n,s,r,a,o,c,d,f){super(e,t,n,s,r,a,o,c,d,f),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Vl extends Fn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new lo(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Xt}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new bi(5,5,5),r=new Mn({name:"CubemapFromEquirect",uniforms:ri(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:bt,blending:xn});r.uniforms.tEquirect.value=t;const a=new Rt(s,r),o=t.minFilter;return t.minFilter===Un&&(t.minFilter=Xt),new kl(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,s=!0){const r=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,s);e.setRenderTarget(r)}}class ji extends _t{constructor(){super(),this.isGroup=!0,this.type="Group"}}const jl={type:"move"};class Ls{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ji,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ji,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ji,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,a=null;const o=this._targetRay,c=this._grip,d=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(d&&e.hand){a=!0;for(const S of e.hand.values()){const g=t.getJointPose(S,n),u=this._getHandJoint(d,S);g!==null&&(u.matrix.fromArray(g.transform.matrix),u.matrix.decompose(u.position,u.rotation,u.scale),u.matrixWorldNeedsUpdate=!0,u.jointRadius=g.radius),u.visible=g!==null}const f=d.joints["index-finger-tip"],p=d.joints["thumb-tip"],h=f.position.distanceTo(p.position),m=.02,_=.005;d.inputState.pinching&&h>m+_?(d.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!d.inputState.pinching&&h<=m-_&&(d.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));o!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(jl)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),d!==null&&(d.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new ji;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}class Wl extends _t{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new on,this.environmentIntensity=1,this.environmentRotation=new on,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}}const Us=new O,Xl=new O,ql=new Pe;class Rn{constructor(e=new O(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const s=Us.subVectors(n,t).cross(Xl.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){const n=e.delta(Us),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||ql.getNormalMatrix(e),s=this.coplanarPoint(Us).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}}const An=new Fr,Wi=new O;class co{constructor(e=new Rn,t=new Rn,n=new Rn,s=new Rn,r=new Rn,a=new Rn){this.planes=[e,t,n,s,r,a]}set(e,t,n,s,r,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=sn){const n=this.planes,s=e.elements,r=s[0],a=s[1],o=s[2],c=s[3],d=s[4],f=s[5],p=s[6],h=s[7],m=s[8],_=s[9],S=s[10],g=s[11],u=s[12],A=s[13],T=s[14],E=s[15];if(n[0].setComponents(c-r,h-d,g-m,E-u).normalize(),n[1].setComponents(c+r,h+d,g+m,E+u).normalize(),n[2].setComponents(c+a,h+f,g+_,E+A).normalize(),n[3].setComponents(c-a,h-f,g-_,E-A).normalize(),n[4].setComponents(c-o,h-p,g-S,E-T).normalize(),t===sn)n[5].setComponents(c+o,h+p,g+S,E+T).normalize();else if(t===is)n[5].setComponents(o,p,S,T).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),An.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),An.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(An)}intersectsSprite(e){return An.center.set(0,0,0),An.radius=.7071067811865476,An.applyMatrix4(e.matrixWorld),this.intersectsSphere(An)}intersectsSphere(e){const t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const s=t[n];if(Wi.x=s.normal.x>0?e.max.x:e.min.x,Wi.y=s.normal.y>0?e.max.y:e.min.y,Wi.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(Wi)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class uo extends Tt{constructor(e,t,n=In,s,r,a,o=jt,c=jt,d,f=_i){if(f!==_i&&f!==vi)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");super(null,s,r,a,o,c,f,n,d),this.isDepthTexture=!0,this.image={width:e,height:t},this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Ir(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class Or extends ln{constructor(e=1,t=1,n=1,s=32,r=1,a=!1,o=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:n,radialSegments:s,heightSegments:r,openEnded:a,thetaStart:o,thetaLength:c};const d=this;s=Math.floor(s),r=Math.floor(r);const f=[],p=[],h=[],m=[];let _=0;const S=[],g=n/2;let u=0;A(),a===!1&&(e>0&&T(!0),t>0&&T(!1)),this.setIndex(f),this.setAttribute("position",new Nt(p,3)),this.setAttribute("normal",new Nt(h,3)),this.setAttribute("uv",new Nt(m,2));function A(){const E=new O,D=new O;let C=0;const w=(t-e)/n;for(let L=0;L<=r;L++){const y=[],M=L/r,N=M*(t-e)+e;for(let H=0;H<=s;H++){const z=H/s,j=z*c+o,K=Math.sin(j),W=Math.cos(j);D.x=N*K,D.y=-M*n+g,D.z=N*W,p.push(D.x,D.y,D.z),E.set(K,w,W).normalize(),h.push(E.x,E.y,E.z),m.push(z,1-M),y.push(_++)}S.push(y)}for(let L=0;L<s;L++)for(let y=0;y<r;y++){const M=S[y][L],N=S[y+1][L],H=S[y+1][L+1],z=S[y][L+1];(e>0||y!==0)&&(f.push(M,N,z),C+=3),(t>0||y!==r-1)&&(f.push(N,H,z),C+=3)}d.addGroup(u,C,0),u+=C}function T(E){const D=_,C=new $e,w=new O;let L=0;const y=E===!0?e:t,M=E===!0?1:-1;for(let H=1;H<=s;H++)p.push(0,g*M,0),h.push(0,M,0),m.push(.5,.5),_++;const N=_;for(let H=0;H<=s;H++){const j=H/s*c+o,K=Math.cos(j),W=Math.sin(j);w.x=y*W,w.y=g*M,w.z=y*K,p.push(w.x,w.y,w.z),h.push(0,M,0),C.x=K*.5+.5,C.y=W*.5*M+.5,m.push(C.x,C.y),_++}for(let H=0;H<s;H++){const z=D+H,j=N+H;E===!0?f.push(j,j+1,z):f.push(j+1,j,z),L+=3}d.addGroup(u,L,E===!0?1:2),u+=L}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Or(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}}class os extends ln{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};const r=e/2,a=t/2,o=Math.floor(n),c=Math.floor(s),d=o+1,f=c+1,p=e/o,h=t/c,m=[],_=[],S=[],g=[];for(let u=0;u<f;u++){const A=u*h-a;for(let T=0;T<d;T++){const E=T*p-r;_.push(E,-A,0),S.push(0,0,1),g.push(T/o),g.push(1-u/c)}}for(let u=0;u<c;u++)for(let A=0;A<o;A++){const T=A+d*u,E=A+d*(u+1),D=A+1+d*(u+1),C=A+1+d*u;m.push(T,E,C),m.push(E,D,C)}this.setIndex(m),this.setAttribute("position",new Nt(_,3)),this.setAttribute("normal",new Nt(S,3)),this.setAttribute("uv",new Nt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new os(e.width,e.height,e.widthSegments,e.heightSegments)}}class Br extends ln{constructor(e=1,t=32,n=16,s=0,r=Math.PI*2,a=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:n,phiStart:s,phiLength:r,thetaStart:a,thetaLength:o},t=Math.max(3,Math.floor(t)),n=Math.max(2,Math.floor(n));const c=Math.min(a+o,Math.PI);let d=0;const f=[],p=new O,h=new O,m=[],_=[],S=[],g=[];for(let u=0;u<=n;u++){const A=[],T=u/n;let E=0;u===0&&a===0?E=.5/t:u===n&&c===Math.PI&&(E=-.5/t);for(let D=0;D<=t;D++){const C=D/t;p.x=-e*Math.cos(s+C*r)*Math.sin(a+T*o),p.y=e*Math.cos(a+T*o),p.z=e*Math.sin(s+C*r)*Math.sin(a+T*o),_.push(p.x,p.y,p.z),h.copy(p).normalize(),S.push(h.x,h.y,h.z),g.push(C+E,1-T),A.push(d++)}f.push(A)}for(let u=0;u<n;u++)for(let A=0;A<t;A++){const T=f[u][A+1],E=f[u][A],D=f[u+1][A],C=f[u+1][A+1];(u!==0||a>0)&&m.push(T,E,C),(u!==n-1||c<Math.PI)&&m.push(E,D,C)}this.setIndex(m),this.setAttribute("position",new Nt(_,3)),this.setAttribute("normal",new Nt(S,3)),this.setAttribute("uv",new Nt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Br(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}}class Yl extends as{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=sl,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class $l extends as{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}class Kl extends oo{constructor(e=-1,t=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-e,a=n+e,o=s+t,c=s-t;if(this.view!==null&&this.view.enabled){const d=(this.right-this.left)/this.view.fullWidth/this.zoom,f=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=d*this.view.offsetX,a=r+d*this.view.width,o-=f*this.view.offsetY,c=o-f*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}class Zl extends Ft{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}}function xa(i,e,t,n){const s=Jl(n);switch(t){case Ya:return i*e;case Ka:return i*e/s.components*s.byteLength;case Dr:return i*e/s.components*s.byteLength;case Za:return i*e*2/s.components*s.byteLength;case Lr:return i*e*2/s.components*s.byteLength;case $a:return i*e*3/s.components*s.byteLength;case Vt:return i*e*4/s.components*s.byteLength;case Ur:return i*e*4/s.components*s.byteLength;case $i:case Ki:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Zi:case Ji:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case tr:case ir:return Math.max(i,16)*Math.max(e,8)/4;case er:case nr:return Math.max(i,8)*Math.max(e,8)/2;case sr:case rr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case ar:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case or:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case lr:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case cr:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case dr:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case ur:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case hr:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case fr:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case pr:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case mr:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case gr:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case xr:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case _r:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case vr:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case Mr:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Qi:case Sr:case yr:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Ja:case Er:return Math.ceil(i/4)*Math.ceil(e/4)*8;case br:case Tr:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Jl(i){switch(i){case an:case Wa:return{byteLength:1,components:1};case gi:case Xa:case Mi:return{byteLength:2,components:1};case Nr:case Pr:return{byteLength:2,components:4};case In:case Rr:case nn:return{byteLength:4,components:1};case qa:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Cr}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Cr);/**
 * @license
 * Copyright 2010-2025 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function ho(){let i=null,e=!1,t=null,n=null;function s(r,a){t(r,a),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Ql(i){const e=new WeakMap;function t(o,c){const d=o.array,f=o.usage,p=d.byteLength,h=i.createBuffer();i.bindBuffer(c,h),i.bufferData(c,d,f),o.onUploadCallback();let m;if(d instanceof Float32Array)m=i.FLOAT;else if(d instanceof Uint16Array)o.isFloat16BufferAttribute?m=i.HALF_FLOAT:m=i.UNSIGNED_SHORT;else if(d instanceof Int16Array)m=i.SHORT;else if(d instanceof Uint32Array)m=i.UNSIGNED_INT;else if(d instanceof Int32Array)m=i.INT;else if(d instanceof Int8Array)m=i.BYTE;else if(d instanceof Uint8Array)m=i.UNSIGNED_BYTE;else if(d instanceof Uint8ClampedArray)m=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+d);return{buffer:h,type:m,bytesPerElement:d.BYTES_PER_ELEMENT,version:o.version,size:p}}function n(o,c,d){const f=c.array,p=c.updateRanges;if(i.bindBuffer(d,o),p.length===0)i.bufferSubData(d,0,f);else{p.sort((m,_)=>m.start-_.start);let h=0;for(let m=1;m<p.length;m++){const _=p[h],S=p[m];S.start<=_.start+_.count+1?_.count=Math.max(_.count,S.start+S.count-_.start):(++h,p[h]=S)}p.length=h+1;for(let m=0,_=p.length;m<_;m++){const S=p[m];i.bufferSubData(d,S.start*f.BYTES_PER_ELEMENT,f,S.start,S.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const f=e.get(o);(!f||f.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const d=e.get(o);if(d===void 0)e.set(o,t(o,c));else if(d.version<o.version){if(d.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(d.buffer,o,c),d.version=o.version}}return{get:s,remove:r,update:a}}var ec=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,tc=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,nc=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ic=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,sc=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,rc=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,ac=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,oc=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,lc=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,cc=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,dc=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,uc=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,hc=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,fc=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,pc=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,mc=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,gc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,xc=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,_c=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,vc=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Mc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,Sc=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,yc=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,Ec=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,bc=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Tc=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Ac=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,wc=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Cc=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Rc=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Nc="gl_FragColor = linearToOutputTexel( gl_FragColor );",Pc=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Dc=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Lc=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Uc=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ic=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Fc=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Oc=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Bc=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,zc=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Gc=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Hc=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,kc=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Vc=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,jc=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Wc=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Xc=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,qc=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Yc=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,$c=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Kc=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Zc=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Jc=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Qc=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,ed=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,td=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,nd=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,id=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,sd=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,rd=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,ad=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,od=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ld=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,cd=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,dd=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,ud=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,hd=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,fd=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,pd=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,md=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,gd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,xd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,_d=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,vd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Md=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Sd=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,yd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Ed=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,bd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Td=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ad=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,wd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Cd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Rd=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Nd=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Pd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Dd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ld=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Ud=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Id=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,Fd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Od=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Bd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,zd=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Gd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Hd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,kd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Vd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,jd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Wd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Xd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,qd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Yd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,$d=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Kd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Zd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Jd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Qd=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,eu=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,tu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,nu=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,iu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,su=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,ru=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,au=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,ou=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,lu=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,cu=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,du=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,uu=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,hu=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,fu=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,pu=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,mu=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,gu=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,xu=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,_u=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vu=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,Mu=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Su=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yu=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Eu=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,bu=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Tu=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Au=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,wu=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Cu=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ru=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Nu=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Pu=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Du=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Le={alphahash_fragment:ec,alphahash_pars_fragment:tc,alphamap_fragment:nc,alphamap_pars_fragment:ic,alphatest_fragment:sc,alphatest_pars_fragment:rc,aomap_fragment:ac,aomap_pars_fragment:oc,batching_pars_vertex:lc,batching_vertex:cc,begin_vertex:dc,beginnormal_vertex:uc,bsdfs:hc,iridescence_fragment:fc,bumpmap_pars_fragment:pc,clipping_planes_fragment:mc,clipping_planes_pars_fragment:gc,clipping_planes_pars_vertex:xc,clipping_planes_vertex:_c,color_fragment:vc,color_pars_fragment:Mc,color_pars_vertex:Sc,color_vertex:yc,common:Ec,cube_uv_reflection_fragment:bc,defaultnormal_vertex:Tc,displacementmap_pars_vertex:Ac,displacementmap_vertex:wc,emissivemap_fragment:Cc,emissivemap_pars_fragment:Rc,colorspace_fragment:Nc,colorspace_pars_fragment:Pc,envmap_fragment:Dc,envmap_common_pars_fragment:Lc,envmap_pars_fragment:Uc,envmap_pars_vertex:Ic,envmap_physical_pars_fragment:Xc,envmap_vertex:Fc,fog_vertex:Oc,fog_pars_vertex:Bc,fog_fragment:zc,fog_pars_fragment:Gc,gradientmap_pars_fragment:Hc,lightmap_pars_fragment:kc,lights_lambert_fragment:Vc,lights_lambert_pars_fragment:jc,lights_pars_begin:Wc,lights_toon_fragment:qc,lights_toon_pars_fragment:Yc,lights_phong_fragment:$c,lights_phong_pars_fragment:Kc,lights_physical_fragment:Zc,lights_physical_pars_fragment:Jc,lights_fragment_begin:Qc,lights_fragment_maps:ed,lights_fragment_end:td,logdepthbuf_fragment:nd,logdepthbuf_pars_fragment:id,logdepthbuf_pars_vertex:sd,logdepthbuf_vertex:rd,map_fragment:ad,map_pars_fragment:od,map_particle_fragment:ld,map_particle_pars_fragment:cd,metalnessmap_fragment:dd,metalnessmap_pars_fragment:ud,morphinstance_vertex:hd,morphcolor_vertex:fd,morphnormal_vertex:pd,morphtarget_pars_vertex:md,morphtarget_vertex:gd,normal_fragment_begin:xd,normal_fragment_maps:_d,normal_pars_fragment:vd,normal_pars_vertex:Md,normal_vertex:Sd,normalmap_pars_fragment:yd,clearcoat_normal_fragment_begin:Ed,clearcoat_normal_fragment_maps:bd,clearcoat_pars_fragment:Td,iridescence_pars_fragment:Ad,opaque_fragment:wd,packing:Cd,premultiplied_alpha_fragment:Rd,project_vertex:Nd,dithering_fragment:Pd,dithering_pars_fragment:Dd,roughnessmap_fragment:Ld,roughnessmap_pars_fragment:Ud,shadowmap_pars_fragment:Id,shadowmap_pars_vertex:Fd,shadowmap_vertex:Od,shadowmask_pars_fragment:Bd,skinbase_vertex:zd,skinning_pars_vertex:Gd,skinning_vertex:Hd,skinnormal_vertex:kd,specularmap_fragment:Vd,specularmap_pars_fragment:jd,tonemapping_fragment:Wd,tonemapping_pars_fragment:Xd,transmission_fragment:qd,transmission_pars_fragment:Yd,uv_pars_fragment:$d,uv_pars_vertex:Kd,uv_vertex:Zd,worldpos_vertex:Jd,background_vert:Qd,background_frag:eu,backgroundCube_vert:tu,backgroundCube_frag:nu,cube_vert:iu,cube_frag:su,depth_vert:ru,depth_frag:au,distanceRGBA_vert:ou,distanceRGBA_frag:lu,equirect_vert:cu,equirect_frag:du,linedashed_vert:uu,linedashed_frag:hu,meshbasic_vert:fu,meshbasic_frag:pu,meshlambert_vert:mu,meshlambert_frag:gu,meshmatcap_vert:xu,meshmatcap_frag:_u,meshnormal_vert:vu,meshnormal_frag:Mu,meshphong_vert:Su,meshphong_frag:yu,meshphysical_vert:Eu,meshphysical_frag:bu,meshtoon_vert:Tu,meshtoon_frag:Au,points_vert:wu,points_frag:Cu,shadow_vert:Ru,shadow_frag:Nu,sprite_vert:Pu,sprite_frag:Du},ne={common:{diffuse:{value:new Ye(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Pe},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Pe}},envmap:{envMap:{value:null},envMapRotation:{value:new Pe},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Pe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Pe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Pe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Pe},normalScale:{value:new $e(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Pe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Pe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Pe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Pe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ye(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ye(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0},uvTransform:{value:new Pe}},sprite:{diffuse:{value:new Ye(16777215)},opacity:{value:1},center:{value:new $e(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Pe},alphaMap:{value:null},alphaMapTransform:{value:new Pe},alphaTest:{value:0}}},Wt={basic:{uniforms:Mt([ne.common,ne.specularmap,ne.envmap,ne.aomap,ne.lightmap,ne.fog]),vertexShader:Le.meshbasic_vert,fragmentShader:Le.meshbasic_frag},lambert:{uniforms:Mt([ne.common,ne.specularmap,ne.envmap,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.fog,ne.lights,{emissive:{value:new Ye(0)}}]),vertexShader:Le.meshlambert_vert,fragmentShader:Le.meshlambert_frag},phong:{uniforms:Mt([ne.common,ne.specularmap,ne.envmap,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.fog,ne.lights,{emissive:{value:new Ye(0)},specular:{value:new Ye(1118481)},shininess:{value:30}}]),vertexShader:Le.meshphong_vert,fragmentShader:Le.meshphong_frag},standard:{uniforms:Mt([ne.common,ne.envmap,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.roughnessmap,ne.metalnessmap,ne.fog,ne.lights,{emissive:{value:new Ye(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Le.meshphysical_vert,fragmentShader:Le.meshphysical_frag},toon:{uniforms:Mt([ne.common,ne.aomap,ne.lightmap,ne.emissivemap,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.gradientmap,ne.fog,ne.lights,{emissive:{value:new Ye(0)}}]),vertexShader:Le.meshtoon_vert,fragmentShader:Le.meshtoon_frag},matcap:{uniforms:Mt([ne.common,ne.bumpmap,ne.normalmap,ne.displacementmap,ne.fog,{matcap:{value:null}}]),vertexShader:Le.meshmatcap_vert,fragmentShader:Le.meshmatcap_frag},points:{uniforms:Mt([ne.points,ne.fog]),vertexShader:Le.points_vert,fragmentShader:Le.points_frag},dashed:{uniforms:Mt([ne.common,ne.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Le.linedashed_vert,fragmentShader:Le.linedashed_frag},depth:{uniforms:Mt([ne.common,ne.displacementmap]),vertexShader:Le.depth_vert,fragmentShader:Le.depth_frag},normal:{uniforms:Mt([ne.common,ne.bumpmap,ne.normalmap,ne.displacementmap,{opacity:{value:1}}]),vertexShader:Le.meshnormal_vert,fragmentShader:Le.meshnormal_frag},sprite:{uniforms:Mt([ne.sprite,ne.fog]),vertexShader:Le.sprite_vert,fragmentShader:Le.sprite_frag},background:{uniforms:{uvTransform:{value:new Pe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Le.background_vert,fragmentShader:Le.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Pe}},vertexShader:Le.backgroundCube_vert,fragmentShader:Le.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Le.cube_vert,fragmentShader:Le.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Le.equirect_vert,fragmentShader:Le.equirect_frag},distanceRGBA:{uniforms:Mt([ne.common,ne.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Le.distanceRGBA_vert,fragmentShader:Le.distanceRGBA_frag},shadow:{uniforms:Mt([ne.lights,ne.fog,{color:{value:new Ye(0)},opacity:{value:1}}]),vertexShader:Le.shadow_vert,fragmentShader:Le.shadow_frag}};Wt.physical={uniforms:Mt([Wt.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Pe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Pe},clearcoatNormalScale:{value:new $e(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Pe},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Pe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Pe},sheen:{value:0},sheenColor:{value:new Ye(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Pe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Pe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Pe},transmissionSamplerSize:{value:new $e},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Pe},attenuationDistance:{value:0},attenuationColor:{value:new Ye(0)},specularColor:{value:new Ye(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Pe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Pe},anisotropyVector:{value:new $e},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Pe}}]),vertexShader:Le.meshphysical_vert,fragmentShader:Le.meshphysical_frag};const Xi={r:0,b:0,g:0},wn=new on,Lu=new lt;function Uu(i,e,t,n,s,r,a){const o=new Ye(0);let c=r===!0?0:1,d,f,p=null,h=0,m=null;function _(T){let E=T.isScene===!0?T.background:null;return E&&E.isTexture&&(E=(T.backgroundBlurriness>0?t:e).get(E)),E}function S(T){let E=!1;const D=_(T);D===null?u(o,c):D&&D.isColor&&(u(D,1),E=!0);const C=i.xr.getEnvironmentBlendMode();C==="additive"?n.buffers.color.setClear(0,0,0,1,a):C==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||E)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function g(T,E){const D=_(E);D&&(D.isCubeTexture||D.mapping===rs)?(f===void 0&&(f=new Rt(new bi(1,1,1),new Mn({name:"BackgroundCubeMaterial",uniforms:ri(Wt.backgroundCube.uniforms),vertexShader:Wt.backgroundCube.vertexShader,fragmentShader:Wt.backgroundCube.fragmentShader,side:bt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),f.geometry.deleteAttribute("normal"),f.geometry.deleteAttribute("uv"),f.onBeforeRender=function(C,w,L){this.matrixWorld.copyPosition(L.matrixWorld)},Object.defineProperty(f.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(f)),wn.copy(E.backgroundRotation),wn.x*=-1,wn.y*=-1,wn.z*=-1,D.isCubeTexture&&D.isRenderTargetTexture===!1&&(wn.y*=-1,wn.z*=-1),f.material.uniforms.envMap.value=D,f.material.uniforms.flipEnvMap.value=D.isCubeTexture&&D.isRenderTargetTexture===!1?-1:1,f.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,f.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,f.material.uniforms.backgroundRotation.value.setFromMatrix4(Lu.makeRotationFromEuler(wn)),f.material.toneMapped=ke.getTransfer(D.colorSpace)!==qe,(p!==D||h!==D.version||m!==i.toneMapping)&&(f.material.needsUpdate=!0,p=D,h=D.version,m=i.toneMapping),f.layers.enableAll(),T.unshift(f,f.geometry,f.material,0,0,null)):D&&D.isTexture&&(d===void 0&&(d=new Rt(new os(2,2),new Mn({name:"BackgroundMaterial",uniforms:ri(Wt.background.uniforms),vertexShader:Wt.background.vertexShader,fragmentShader:Wt.background.fragmentShader,side:vn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),d.geometry.deleteAttribute("normal"),Object.defineProperty(d.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(d)),d.material.uniforms.t2D.value=D,d.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,d.material.toneMapped=ke.getTransfer(D.colorSpace)!==qe,D.matrixAutoUpdate===!0&&D.updateMatrix(),d.material.uniforms.uvTransform.value.copy(D.matrix),(p!==D||h!==D.version||m!==i.toneMapping)&&(d.material.needsUpdate=!0,p=D,h=D.version,m=i.toneMapping),d.layers.enableAll(),T.unshift(d,d.geometry,d.material,0,0,null))}function u(T,E){T.getRGB(Xi,ao(i)),n.buffers.color.setClear(Xi.r,Xi.g,Xi.b,E,a)}function A(){f!==void 0&&(f.geometry.dispose(),f.material.dispose(),f=void 0),d!==void 0&&(d.geometry.dispose(),d.material.dispose(),d=void 0)}return{getClearColor:function(){return o},setClearColor:function(T,E=1){o.set(T),c=E,u(o,c)},getClearAlpha:function(){return c},setClearAlpha:function(T){c=T,u(o,c)},render:S,addToRenderList:g,dispose:A}}function Iu(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null);let r=s,a=!1;function o(M,N,H,z,j){let K=!1;const W=p(z,H,N);r!==W&&(r=W,d(r.object)),K=m(M,z,H,j),K&&_(M,z,H,j),j!==null&&e.update(j,i.ELEMENT_ARRAY_BUFFER),(K||a)&&(a=!1,E(M,N,H,z),j!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(j).buffer))}function c(){return i.createVertexArray()}function d(M){return i.bindVertexArray(M)}function f(M){return i.deleteVertexArray(M)}function p(M,N,H){const z=H.wireframe===!0;let j=n[M.id];j===void 0&&(j={},n[M.id]=j);let K=j[N.id];K===void 0&&(K={},j[N.id]=K);let W=K[z];return W===void 0&&(W=h(c()),K[z]=W),W}function h(M){const N=[],H=[],z=[];for(let j=0;j<t;j++)N[j]=0,H[j]=0,z[j]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:N,enabledAttributes:H,attributeDivisors:z,object:M,attributes:{},index:null}}function m(M,N,H,z){const j=r.attributes,K=N.attributes;let W=0;const ee=H.getAttributes();for(const V in ee)if(ee[V].location>=0){const ue=j[V];let _e=K[V];if(_e===void 0&&(V==="instanceMatrix"&&M.instanceMatrix&&(_e=M.instanceMatrix),V==="instanceColor"&&M.instanceColor&&(_e=M.instanceColor)),ue===void 0||ue.attribute!==_e||_e&&ue.data!==_e.data)return!0;W++}return r.attributesNum!==W||r.index!==z}function _(M,N,H,z){const j={},K=N.attributes;let W=0;const ee=H.getAttributes();for(const V in ee)if(ee[V].location>=0){let ue=K[V];ue===void 0&&(V==="instanceMatrix"&&M.instanceMatrix&&(ue=M.instanceMatrix),V==="instanceColor"&&M.instanceColor&&(ue=M.instanceColor));const _e={};_e.attribute=ue,ue&&ue.data&&(_e.data=ue.data),j[V]=_e,W++}r.attributes=j,r.attributesNum=W,r.index=z}function S(){const M=r.newAttributes;for(let N=0,H=M.length;N<H;N++)M[N]=0}function g(M){u(M,0)}function u(M,N){const H=r.newAttributes,z=r.enabledAttributes,j=r.attributeDivisors;H[M]=1,z[M]===0&&(i.enableVertexAttribArray(M),z[M]=1),j[M]!==N&&(i.vertexAttribDivisor(M,N),j[M]=N)}function A(){const M=r.newAttributes,N=r.enabledAttributes;for(let H=0,z=N.length;H<z;H++)N[H]!==M[H]&&(i.disableVertexAttribArray(H),N[H]=0)}function T(M,N,H,z,j,K,W){W===!0?i.vertexAttribIPointer(M,N,H,j,K):i.vertexAttribPointer(M,N,H,z,j,K)}function E(M,N,H,z){S();const j=z.attributes,K=H.getAttributes(),W=N.defaultAttributeValues;for(const ee in K){const V=K[ee];if(V.location>=0){let se=j[ee];if(se===void 0&&(ee==="instanceMatrix"&&M.instanceMatrix&&(se=M.instanceMatrix),ee==="instanceColor"&&M.instanceColor&&(se=M.instanceColor)),se!==void 0){const ue=se.normalized,_e=se.itemSize,Ue=e.get(se);if(Ue===void 0)continue;const Ke=Ue.buffer,q=Ue.type,te=Ue.bytesPerElement,me=q===i.INT||q===i.UNSIGNED_INT||se.gpuType===Rr;if(se.isInterleavedBufferAttribute){const re=se.data,ye=re.stride,Ve=se.offset;if(re.isInstancedInterleavedBuffer){for(let Ae=0;Ae<V.locationSize;Ae++)u(V.location+Ae,re.meshPerAttribute);M.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=re.meshPerAttribute*re.count)}else for(let Ae=0;Ae<V.locationSize;Ae++)g(V.location+Ae);i.bindBuffer(i.ARRAY_BUFFER,Ke);for(let Ae=0;Ae<V.locationSize;Ae++)T(V.location+Ae,_e/V.locationSize,q,ue,ye*te,(Ve+_e/V.locationSize*Ae)*te,me)}else{if(se.isInstancedBufferAttribute){for(let re=0;re<V.locationSize;re++)u(V.location+re,se.meshPerAttribute);M.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=se.meshPerAttribute*se.count)}else for(let re=0;re<V.locationSize;re++)g(V.location+re);i.bindBuffer(i.ARRAY_BUFFER,Ke);for(let re=0;re<V.locationSize;re++)T(V.location+re,_e/V.locationSize,q,ue,_e*te,_e/V.locationSize*re*te,me)}}else if(W!==void 0){const ue=W[ee];if(ue!==void 0)switch(ue.length){case 2:i.vertexAttrib2fv(V.location,ue);break;case 3:i.vertexAttrib3fv(V.location,ue);break;case 4:i.vertexAttrib4fv(V.location,ue);break;default:i.vertexAttrib1fv(V.location,ue)}}}}A()}function D(){L();for(const M in n){const N=n[M];for(const H in N){const z=N[H];for(const j in z)f(z[j].object),delete z[j];delete N[H]}delete n[M]}}function C(M){if(n[M.id]===void 0)return;const N=n[M.id];for(const H in N){const z=N[H];for(const j in z)f(z[j].object),delete z[j];delete N[H]}delete n[M.id]}function w(M){for(const N in n){const H=n[N];if(H[M.id]===void 0)continue;const z=H[M.id];for(const j in z)f(z[j].object),delete z[j];delete H[M.id]}}function L(){y(),a=!0,r!==s&&(r=s,d(r.object))}function y(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:L,resetDefaultState:y,dispose:D,releaseStatesOfGeometry:C,releaseStatesOfProgram:w,initAttributes:S,enableAttribute:g,disableUnusedAttributes:A}}function Fu(i,e,t){let n;function s(d){n=d}function r(d,f){i.drawArrays(n,d,f),t.update(f,n,1)}function a(d,f,p){p!==0&&(i.drawArraysInstanced(n,d,f,p),t.update(f,n,p))}function o(d,f,p){if(p===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,d,0,f,0,p);let m=0;for(let _=0;_<p;_++)m+=f[_];t.update(m,n,1)}function c(d,f,p,h){if(p===0)return;const m=e.get("WEBGL_multi_draw");if(m===null)for(let _=0;_<d.length;_++)a(d[_],f[_],h[_]);else{m.multiDrawArraysInstancedWEBGL(n,d,0,f,0,h,0,p);let _=0;for(let S=0;S<p;S++)_+=f[S]*h[S];t.update(_,n,1)}}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o,this.renderMultiDrawInstances=c}function Ou(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){const w=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(w){return!(w!==Vt&&n.convert(w)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){const L=w===Mi&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(w!==an&&n.convert(w)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&w!==nn&&!L)}function c(w){if(w==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let d=t.precision!==void 0?t.precision:"highp";const f=c(d);f!==d&&(console.warn("THREE.WebGLRenderer:",d,"not supported, using",f,"instead."),d=f);const p=t.logarithmicDepthBuffer===!0,h=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),m=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),u=i.getParameter(i.MAX_VERTEX_ATTRIBS),A=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),T=i.getParameter(i.MAX_VARYING_VECTORS),E=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),D=_>0,C=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:d,logarithmicDepthBuffer:p,reverseDepthBuffer:h,maxTextures:m,maxVertexTextures:_,maxTextureSize:S,maxCubemapSize:g,maxAttributes:u,maxVertexUniforms:A,maxVaryings:T,maxFragmentUniforms:E,vertexTextures:D,maxSamples:C}}function Bu(i){const e=this;let t=null,n=0,s=!1,r=!1;const a=new Rn,o=new Pe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(p,h){const m=p.length!==0||h||n!==0||s;return s=h,n=p.length,m},this.beginShadows=function(){r=!0,f(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(p,h){t=f(p,h,0)},this.setState=function(p,h,m){const _=p.clippingPlanes,S=p.clipIntersection,g=p.clipShadows,u=i.get(p);if(!s||_===null||_.length===0||r&&!g)r?f(null):d();else{const A=r?0:n,T=A*4;let E=u.clippingState||null;c.value=E,E=f(_,h,T,m);for(let D=0;D!==T;++D)E[D]=t[D];u.clippingState=E,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=A}};function d(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function f(p,h,m,_){const S=p!==null?p.length:0;let g=null;if(S!==0){if(g=c.value,_!==!0||g===null){const u=m+S*4,A=h.matrixWorldInverse;o.getNormalMatrix(A),(g===null||g.length<u)&&(g=new Float32Array(u));for(let T=0,E=m;T!==S;++T,E+=4)a.copy(p[T]).applyMatrix4(A,o),a.normal.toArray(g,E),g[E+3]=a.constant}c.value=g,c.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,g}}function zu(i){let e=new WeakMap;function t(a,o){return o===Ks?a.mapping=ni:o===Zs&&(a.mapping=ii),a}function n(a){if(a&&a.isTexture){const o=a.mapping;if(o===Ks||o===Zs)if(e.has(a)){const c=e.get(a).texture;return t(c,a.mapping)}else{const c=a.image;if(c&&c.height>0){const d=new Vl(c.height);return d.fromEquirectangularTexture(i,a),e.set(a,d),a.addEventListener("dispose",s),t(d.texture,a.mapping)}else return null}}return a}function s(a){const o=a.target;o.removeEventListener("dispose",s);const c=e.get(o);c!==void 0&&(e.delete(o),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}const Jn=4,_a=[.125,.215,.35,.446,.526,.582],Dn=20,Is=new Kl,va=new Ye;let Fs=null,Os=0,Bs=0,zs=!1;const Nn=(1+Math.sqrt(5))/2,Zn=1/Nn,Ma=[new O(-Nn,Zn,0),new O(Nn,Zn,0),new O(-Zn,0,Nn),new O(Zn,0,Nn),new O(0,Nn,-Zn),new O(0,Nn,Zn),new O(-1,1,-1),new O(1,1,-1),new O(-1,1,1),new O(1,1,1)],Gu=new O;class Sa{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100,r={}){const{size:a=256,position:o=Gu}=r;Fs=this._renderer.getRenderTarget(),Os=this._renderer.getActiveCubeFace(),Bs=this._renderer.getActiveMipmapLevel(),zs=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,n,s,c,o),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=ba(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Ea(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Fs,Os,Bs),this._renderer.xr.enabled=zs,e.scissorTest=!1,qi(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ni||e.mapping===ii?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Fs=this._renderer.getRenderTarget(),Os=this._renderer.getActiveCubeFace(),Bs=this._renderer.getActiveMipmapLevel(),zs=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:Xt,minFilter:Xt,generateMipmaps:!1,type:Mi,format:Vt,colorSpace:si,depthBuffer:!1},s=ya(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=ya(e,t,n);const{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=Hu(r)),this._blurMaterial=ku(r,e,t)}return s}_compileMaterial(e){const t=new Rt(this._lodPlanes[0],e);this._renderer.compile(t,Is)}_sceneToCubeUV(e,t,n,s,r){const c=new Ft(90,1,t,n),d=[1,-1,1,1,1,1],f=[1,1,1,-1,-1,-1],p=this._renderer,h=p.autoClear,m=p.toneMapping;p.getClearColor(va),p.toneMapping=_n,p.autoClear=!1;const _=new mi({name:"PMREM.Background",side:bt,depthWrite:!1,depthTest:!1}),S=new Rt(new bi,_);let g=!1;const u=e.background;u?u.isColor&&(_.color.copy(u),e.background=null,g=!0):(_.color.copy(va),g=!0);for(let A=0;A<6;A++){const T=A%3;T===0?(c.up.set(0,d[A],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+f[A],r.y,r.z)):T===1?(c.up.set(0,0,d[A]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+f[A],r.z)):(c.up.set(0,d[A],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+f[A]));const E=this._cubeSize;qi(s,T*E,A>2?E:0,E,E),p.setRenderTarget(s),g&&p.render(S,c),p.render(e,c)}S.geometry.dispose(),S.material.dispose(),p.toneMapping=m,p.autoClear=h,e.background=u}_textureToCubeUV(e,t){const n=this._renderer,s=e.mapping===ni||e.mapping===ii;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=ba()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Ea());const r=s?this._cubemapMaterial:this._equirectMaterial,a=new Rt(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=e;const c=this._cubeSize;qi(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(a,Is)}_applyPMREM(e){const t=this._renderer,n=t.autoClear;t.autoClear=!1;const s=this._lodPlanes.length;for(let r=1;r<s;r++){const a=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),o=Ma[(s-r-1)%Ma.length];this._blur(e,r-1,r,a,o)}t.autoClear=n}_blur(e,t,n,s,r){const a=this._pingPongRenderTarget;this._halfBlur(e,a,t,n,s,"latitudinal",r),this._halfBlur(a,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,a,o){const c=this._renderer,d=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const f=3,p=new Rt(this._lodPlanes[s],d),h=d.uniforms,m=this._sizeLods[n]-1,_=isFinite(r)?Math.PI/(2*m):2*Math.PI/(2*Dn-1),S=r/_,g=isFinite(r)?1+Math.floor(f*S):Dn;g>Dn&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to ${Dn}`);const u=[];let A=0;for(let w=0;w<Dn;++w){const L=w/S,y=Math.exp(-L*L/2);u.push(y),w===0?A+=y:w<g&&(A+=2*y)}for(let w=0;w<u.length;w++)u[w]=u[w]/A;h.envMap.value=e.texture,h.samples.value=g,h.weights.value=u,h.latitudinal.value=a==="latitudinal",o&&(h.poleAxis.value=o);const{_lodMax:T}=this;h.dTheta.value=_,h.mipInt.value=T-n;const E=this._sizeLods[s],D=3*E*(s>T-Jn?s-T+Jn:0),C=4*(this._cubeSize-E);qi(t,D,C,3*E,2*E),c.setRenderTarget(t),c.render(p,Is)}}function Hu(i){const e=[],t=[],n=[];let s=i;const r=i-Jn+1+_a.length;for(let a=0;a<r;a++){const o=Math.pow(2,s);t.push(o);let c=1/o;a>i-Jn?c=_a[a-i+Jn-1]:a===0&&(c=0),n.push(c);const d=1/(o-2),f=-d,p=1+d,h=[f,f,p,f,p,p,f,f,p,p,f,p],m=6,_=6,S=3,g=2,u=1,A=new Float32Array(S*_*m),T=new Float32Array(g*_*m),E=new Float32Array(u*_*m);for(let C=0;C<m;C++){const w=C%3*2/3-1,L=C>2?0:-1,y=[w,L,0,w+2/3,L,0,w+2/3,L+1,0,w,L,0,w+2/3,L+1,0,w,L+1,0];A.set(y,S*_*C),T.set(h,g*_*C);const M=[C,C,C,C,C,C];E.set(M,u*_*C)}const D=new ln;D.setAttribute("position",new qt(A,S)),D.setAttribute("uv",new qt(T,g)),D.setAttribute("faceIndex",new qt(E,u)),e.push(D),s>Jn&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function ya(i,e,t){const n=new Fn(i,e,t);return n.texture.mapping=rs,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function qi(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function ku(i,e,t){const n=new Float32Array(Dn),s=new O(0,1,0);return new Mn({name:"SphericalGaussianBlur",defines:{n:Dn,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:zr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:xn,depthTest:!1,depthWrite:!1})}function Ea(){return new Mn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:zr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:xn,depthTest:!1,depthWrite:!1})}function ba(){return new Mn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:zr(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:xn,depthTest:!1,depthWrite:!1})}function zr(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Vu(i){let e=new WeakMap,t=null;function n(o){if(o&&o.isTexture){const c=o.mapping,d=c===Ks||c===Zs,f=c===ni||c===ii;if(d||f){let p=e.get(o);const h=p!==void 0?p.texture.pmremVersion:0;if(o.isRenderTargetTexture&&o.pmremVersion!==h)return t===null&&(t=new Sa(i)),p=d?t.fromEquirectangular(o,p):t.fromCubemap(o,p),p.texture.pmremVersion=o.pmremVersion,e.set(o,p),p.texture;if(p!==void 0)return p.texture;{const m=o.image;return d&&m&&m.height>0||f&&m&&s(m)?(t===null&&(t=new Sa(i)),p=d?t.fromEquirectangular(o):t.fromCubemap(o),p.texture.pmremVersion=o.pmremVersion,e.set(o,p),o.addEventListener("dispose",r),p.texture):null}}}return o}function s(o){let c=0;const d=6;for(let f=0;f<d;f++)o[f]!==void 0&&c++;return c===d}function r(o){const c=o.target;c.removeEventListener("dispose",r);const d=e.get(c);d!==void 0&&(e.delete(c),d.dispose())}function a(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:a}}function ju(i){const e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const s=t(n);return s===null&&es("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function Wu(i,e,t,n){const s={},r=new WeakMap;function a(p){const h=p.target;h.index!==null&&e.remove(h.index);for(const _ in h.attributes)e.remove(h.attributes[_]);h.removeEventListener("dispose",a),delete s[h.id];const m=r.get(h);m&&(e.remove(m),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function o(p,h){return s[h.id]===!0||(h.addEventListener("dispose",a),s[h.id]=!0,t.memory.geometries++),h}function c(p){const h=p.attributes;for(const m in h)e.update(h[m],i.ARRAY_BUFFER)}function d(p){const h=[],m=p.index,_=p.attributes.position;let S=0;if(m!==null){const A=m.array;S=m.version;for(let T=0,E=A.length;T<E;T+=3){const D=A[T+0],C=A[T+1],w=A[T+2];h.push(D,C,C,w,w,D)}}else if(_!==void 0){const A=_.array;S=_.version;for(let T=0,E=A.length/3-1;T<E;T+=3){const D=T+0,C=T+1,w=T+2;h.push(D,C,C,w,w,D)}}else return;const g=new(eo(h)?ro:so)(h,1);g.version=S;const u=r.get(p);u&&e.remove(u),r.set(p,g)}function f(p){const h=r.get(p);if(h){const m=p.index;m!==null&&h.version<m.version&&d(p)}else d(p);return r.get(p)}return{get:o,update:c,getWireframeAttribute:f}}function Xu(i,e,t){let n;function s(h){n=h}let r,a;function o(h){r=h.type,a=h.bytesPerElement}function c(h,m){i.drawElements(n,m,r,h*a),t.update(m,n,1)}function d(h,m,_){_!==0&&(i.drawElementsInstanced(n,m,r,h*a,_),t.update(m,n,_))}function f(h,m,_){if(_===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,m,0,r,h,0,_);let g=0;for(let u=0;u<_;u++)g+=m[u];t.update(g,n,1)}function p(h,m,_,S){if(_===0)return;const g=e.get("WEBGL_multi_draw");if(g===null)for(let u=0;u<h.length;u++)d(h[u]/a,m[u],S[u]);else{g.multiDrawElementsInstancedWEBGL(n,m,0,r,h,0,S,0,_);let u=0;for(let A=0;A<_;A++)u+=m[A]*S[A];t.update(u,n,1)}}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=d,this.renderMultiDraw=f,this.renderMultiDrawInstances=p}function qu(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(r/3);break;case i.LINES:t.lines+=o*(r/2);break;case i.LINE_STRIP:t.lines+=o*(r-1);break;case i.LINE_LOOP:t.lines+=o*r;break;case i.POINTS:t.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function Yu(i,e,t){const n=new WeakMap,s=new rt;function r(a,o,c){const d=a.morphTargetInfluences,f=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,p=f!==void 0?f.length:0;let h=n.get(o);if(h===void 0||h.count!==p){let y=function(){w.dispose(),n.delete(o),o.removeEventListener("dispose",y)};h!==void 0&&h.texture.dispose();const m=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],u=o.morphAttributes.normal||[],A=o.morphAttributes.color||[];let T=0;m===!0&&(T=1),_===!0&&(T=2),S===!0&&(T=3);let E=o.attributes.position.count*T,D=1;E>e.maxTextureSize&&(D=Math.ceil(E/e.maxTextureSize),E=e.maxTextureSize);const C=new Float32Array(E*D*4*p),w=new to(C,E,D,p);w.type=nn,w.needsUpdate=!0;const L=T*4;for(let M=0;M<p;M++){const N=g[M],H=u[M],z=A[M],j=E*D*4*M;for(let K=0;K<N.count;K++){const W=K*L;m===!0&&(s.fromBufferAttribute(N,K),C[j+W+0]=s.x,C[j+W+1]=s.y,C[j+W+2]=s.z,C[j+W+3]=0),_===!0&&(s.fromBufferAttribute(H,K),C[j+W+4]=s.x,C[j+W+5]=s.y,C[j+W+6]=s.z,C[j+W+7]=0),S===!0&&(s.fromBufferAttribute(z,K),C[j+W+8]=s.x,C[j+W+9]=s.y,C[j+W+10]=s.z,C[j+W+11]=z.itemSize===4?s.w:1)}}h={count:p,texture:w,size:new $e(E,D)},n.set(o,h),o.addEventListener("dispose",y)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let m=0;for(let S=0;S<d.length;S++)m+=d[S];const _=o.morphTargetsRelative?1:1-m;c.getUniforms().setValue(i,"morphTargetBaseInfluence",_),c.getUniforms().setValue(i,"morphTargetInfluences",d)}c.getUniforms().setValue(i,"morphTargetsTexture",h.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function $u(i,e,t,n){let s=new WeakMap;function r(c){const d=n.render.frame,f=c.geometry,p=e.get(c,f);if(s.get(p)!==d&&(e.update(p),s.set(p,d)),c.isInstancedMesh&&(c.hasEventListener("dispose",o)===!1&&c.addEventListener("dispose",o),s.get(c)!==d&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,d))),c.isSkinnedMesh){const h=c.skeleton;s.get(h)!==d&&(h.update(),s.set(h,d))}return p}function a(){s=new WeakMap}function o(c){const d=c.target;d.removeEventListener("dispose",o),t.remove(d.instanceMatrix),d.instanceColor!==null&&t.remove(d.instanceColor)}return{update:r,dispose:a}}const fo=new Tt,Ta=new uo(1,1),po=new to,mo=new Tl,go=new lo,Aa=[],wa=[],Ca=new Float32Array(16),Ra=new Float32Array(9),Na=new Float32Array(4);function oi(i,e,t){const n=i[0];if(n<=0||n>0)return i;const s=e*t;let r=Aa[s];if(r===void 0&&(r=new Float32Array(s),Aa[s]=r),e!==0){n.toArray(r,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(r,o)}return r}function ct(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function dt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function ls(i,e){let t=wa[e];t===void 0&&(t=new Int32Array(e),wa[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function Ku(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function Zu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ct(t,e))return;i.uniform2fv(this.addr,e),dt(t,e)}}function Ju(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(ct(t,e))return;i.uniform3fv(this.addr,e),dt(t,e)}}function Qu(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ct(t,e))return;i.uniform4fv(this.addr,e),dt(t,e)}}function eh(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ct(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),dt(t,e)}else{if(ct(t,n))return;Na.set(n),i.uniformMatrix2fv(this.addr,!1,Na),dt(t,n)}}function th(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ct(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),dt(t,e)}else{if(ct(t,n))return;Ra.set(n),i.uniformMatrix3fv(this.addr,!1,Ra),dt(t,n)}}function nh(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(ct(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),dt(t,e)}else{if(ct(t,n))return;Ca.set(n),i.uniformMatrix4fv(this.addr,!1,Ca),dt(t,n)}}function ih(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function sh(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ct(t,e))return;i.uniform2iv(this.addr,e),dt(t,e)}}function rh(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ct(t,e))return;i.uniform3iv(this.addr,e),dt(t,e)}}function ah(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ct(t,e))return;i.uniform4iv(this.addr,e),dt(t,e)}}function oh(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function lh(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(ct(t,e))return;i.uniform2uiv(this.addr,e),dt(t,e)}}function ch(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(ct(t,e))return;i.uniform3uiv(this.addr,e),dt(t,e)}}function dh(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(ct(t,e))return;i.uniform4uiv(this.addr,e),dt(t,e)}}function uh(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Ta.compareFunction=Qa,r=Ta):r=fo,t.setTexture2D(e||r,s)}function hh(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||mo,s)}function fh(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||go,s)}function ph(i,e,t){const n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||po,s)}function mh(i){switch(i){case 5126:return Ku;case 35664:return Zu;case 35665:return Ju;case 35666:return Qu;case 35674:return eh;case 35675:return th;case 35676:return nh;case 5124:case 35670:return ih;case 35667:case 35671:return sh;case 35668:case 35672:return rh;case 35669:case 35673:return ah;case 5125:return oh;case 36294:return lh;case 36295:return ch;case 36296:return dh;case 35678:case 36198:case 36298:case 36306:case 35682:return uh;case 35679:case 36299:case 36307:return hh;case 35680:case 36300:case 36308:case 36293:return fh;case 36289:case 36303:case 36311:case 36292:return ph}}function gh(i,e){i.uniform1fv(this.addr,e)}function xh(i,e){const t=oi(e,this.size,2);i.uniform2fv(this.addr,t)}function _h(i,e){const t=oi(e,this.size,3);i.uniform3fv(this.addr,t)}function vh(i,e){const t=oi(e,this.size,4);i.uniform4fv(this.addr,t)}function Mh(i,e){const t=oi(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Sh(i,e){const t=oi(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function yh(i,e){const t=oi(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Eh(i,e){i.uniform1iv(this.addr,e)}function bh(i,e){i.uniform2iv(this.addr,e)}function Th(i,e){i.uniform3iv(this.addr,e)}function Ah(i,e){i.uniform4iv(this.addr,e)}function wh(i,e){i.uniform1uiv(this.addr,e)}function Ch(i,e){i.uniform2uiv(this.addr,e)}function Rh(i,e){i.uniform3uiv(this.addr,e)}function Nh(i,e){i.uniform4uiv(this.addr,e)}function Ph(i,e,t){const n=this.cache,s=e.length,r=ls(t,s);ct(n,r)||(i.uniform1iv(this.addr,r),dt(n,r));for(let a=0;a!==s;++a)t.setTexture2D(e[a]||fo,r[a])}function Dh(i,e,t){const n=this.cache,s=e.length,r=ls(t,s);ct(n,r)||(i.uniform1iv(this.addr,r),dt(n,r));for(let a=0;a!==s;++a)t.setTexture3D(e[a]||mo,r[a])}function Lh(i,e,t){const n=this.cache,s=e.length,r=ls(t,s);ct(n,r)||(i.uniform1iv(this.addr,r),dt(n,r));for(let a=0;a!==s;++a)t.setTextureCube(e[a]||go,r[a])}function Uh(i,e,t){const n=this.cache,s=e.length,r=ls(t,s);ct(n,r)||(i.uniform1iv(this.addr,r),dt(n,r));for(let a=0;a!==s;++a)t.setTexture2DArray(e[a]||po,r[a])}function Ih(i){switch(i){case 5126:return gh;case 35664:return xh;case 35665:return _h;case 35666:return vh;case 35674:return Mh;case 35675:return Sh;case 35676:return yh;case 5124:case 35670:return Eh;case 35667:case 35671:return bh;case 35668:case 35672:return Th;case 35669:case 35673:return Ah;case 5125:return wh;case 36294:return Ch;case 36295:return Rh;case 36296:return Nh;case 35678:case 36198:case 36298:case 36306:case 35682:return Ph;case 35679:case 36299:case 36307:return Dh;case 35680:case 36300:case 36308:case 36293:return Lh;case 36289:case 36303:case 36311:case 36292:return Uh}}class Fh{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=mh(t.type)}}class Oh{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Ih(t.type)}}class Bh{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(e,t[o.id],n)}}}const Gs=/(\w+)(\])?(\[|\.)?/g;function Pa(i,e){i.seq.push(e),i.map[e.id]=e}function zh(i,e,t){const n=i.name,s=n.length;for(Gs.lastIndex=0;;){const r=Gs.exec(n),a=Gs.lastIndex;let o=r[1];const c=r[2]==="]",d=r[3];if(c&&(o=o|0),d===void 0||d==="["&&a+2===s){Pa(t,d===void 0?new Fh(o,i,e):new Oh(o,i,e));break}else{let p=t.map[o];p===void 0&&(p=new Bh(o),Pa(t,p)),t=p}}}class ts{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){const r=e.getActiveUniform(t,s),a=e.getUniformLocation(t,r.name);zh(r,a,this)}}setValue(e,t,n,s){const r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){const s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,a=t.length;r!==a;++r){const o=t[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,s)}}static seqWithValue(e,t){const n=[];for(let s=0,r=e.length;s!==r;++s){const a=e[s];a.id in t&&n.push(a)}return n}}function Da(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const Gh=37297;let Hh=0;function kh(i,e){const t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const La=new Pe;function Vh(i){ke._getMatrix(La,ke.workingColorSpace,i);const e=`mat3( ${La.elements.map(t=>t.toFixed(4))} )`;switch(ke.getTransfer(i)){case ns:return[e,"LinearTransferOETF"];case qe:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Ua(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";const r=/ERROR: 0:(\d+)/.exec(s);if(r){const a=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+kh(i.getShaderSource(e),a)}else return s}function jh(i,e){const t=Vh(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function Wh(i,e){let t;switch(e){case Ko:t="Linear";break;case Zo:t="Reinhard";break;case Jo:t="Cineon";break;case Qo:t="ACESFilmic";break;case tl:t="AgX";break;case nl:t="Neutral";break;case el:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Yi=new O;function Xh(){ke.getLuminanceCoefficients(Yi);const i=Yi.x.toFixed(4),e=Yi.y.toFixed(4),t=Yi.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function qh(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(pi).join(`
`)}function Yh(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function $h(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(e,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),t[a]={type:r.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function pi(i){return i!==""}function Ia(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Fa(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const Kh=/^[ \t]*#include +<([\w\d./]+)>/gm;function wr(i){return i.replace(Kh,Jh)}const Zh=new Map;function Jh(i,e){let t=Le[e];if(t===void 0){const n=Zh.get(e);if(n!==void 0)t=Le[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return wr(t)}const Qh=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Oa(i){return i.replace(Qh,ef)}function ef(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Ba(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function tf(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===ka?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===Ro?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===en&&(e="SHADOWMAP_TYPE_VSM"),e}function nf(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case ni:case ii:e="ENVMAP_TYPE_CUBE";break;case rs:e="ENVMAP_TYPE_CUBE_UV";break}return e}function sf(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case ii:e="ENVMAP_MODE_REFRACTION";break}return e}function rf(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Va:e="ENVMAP_BLENDING_MULTIPLY";break;case Yo:e="ENVMAP_BLENDING_MIX";break;case $o:e="ENVMAP_BLENDING_ADD";break}return e}function af(i){const e=i.envMapCubeUVHeight;if(e===null)return null;const t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:n,maxMip:t}}function of(i,e,t,n){const s=i.getContext(),r=t.defines;let a=t.vertexShader,o=t.fragmentShader;const c=tf(t),d=nf(t),f=sf(t),p=rf(t),h=af(t),m=qh(t),_=Yh(r),S=s.createProgram();let g,u,A=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(pi).join(`
`),g.length>0&&(g+=`
`),u=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_].filter(pi).join(`
`),u.length>0&&(u+=`
`)):(g=[Ba(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+f:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(pi).join(`
`),u=[Ba(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,_,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+d:"",t.envMap?"#define "+f:"",t.envMap?"#define "+p:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==_n?"#define TONE_MAPPING":"",t.toneMapping!==_n?Le.tonemapping_pars_fragment:"",t.toneMapping!==_n?Wh("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Le.colorspace_pars_fragment,jh("linearToOutputTexel",t.outputColorSpace),Xh(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(pi).join(`
`)),a=wr(a),a=Ia(a,t),a=Fa(a,t),o=wr(o),o=Ia(o,t),o=Fa(o,t),a=Oa(a),o=Oa(o),t.isRawShaderMaterial!==!0&&(A=`#version 300 es
`,g=[m,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,u=["#define varying in",t.glslVersion===Qr?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Qr?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+u);const T=A+g+a,E=A+u+o,D=Da(s,s.VERTEX_SHADER,T),C=Da(s,s.FRAGMENT_SHADER,E);s.attachShader(S,D),s.attachShader(S,C),t.index0AttributeName!==void 0?s.bindAttribLocation(S,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function w(N){if(i.debug.checkShaderErrors){const H=s.getProgramInfoLog(S).trim(),z=s.getShaderInfoLog(D).trim(),j=s.getShaderInfoLog(C).trim();let K=!0,W=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(K=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,S,D,C);else{const ee=Ua(s,D,"vertex"),V=Ua(s,C,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+N.name+`
Material Type: `+N.type+`

Program Info Log: `+H+`
`+ee+`
`+V)}else H!==""?console.warn("THREE.WebGLProgram: Program Info Log:",H):(z===""||j==="")&&(W=!1);W&&(N.diagnostics={runnable:K,programLog:H,vertexShader:{log:z,prefix:g},fragmentShader:{log:j,prefix:u}})}s.deleteShader(D),s.deleteShader(C),L=new ts(s,S),y=$h(s,S)}let L;this.getUniforms=function(){return L===void 0&&w(this),L};let y;this.getAttributes=function(){return y===void 0&&w(this),y};let M=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return M===!1&&(M=s.getProgramParameter(S,Gh)),M},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Hh++,this.cacheKey=e,this.usedTimes=1,this.program=S,this.vertexShader=D,this.fragmentShader=C,this}let lf=0;class cf{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){const t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(e);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new df(e),t.set(e,n)),n}}class df{constructor(e){this.id=lf++,this.code=e,this.usedTimes=0}}function uf(i,e,t,n,s,r,a){const o=new no,c=new cf,d=new Set,f=[],p=s.logarithmicDepthBuffer,h=s.vertexTextures;let m=s.precision;const _={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function S(y){return d.add(y),y===0?"uv":`uv${y}`}function g(y,M,N,H,z){const j=H.fog,K=z.geometry,W=y.isMeshStandardMaterial?H.environment:null,ee=(y.isMeshStandardMaterial?t:e).get(y.envMap||W),V=ee&&ee.mapping===rs?ee.image.height:null,se=_[y.type];y.precision!==null&&(m=s.getMaxPrecision(y.precision),m!==y.precision&&console.warn("THREE.WebGLProgram.getParameters:",y.precision,"not supported, using",m,"instead."));const ue=K.morphAttributes.position||K.morphAttributes.normal||K.morphAttributes.color,_e=ue!==void 0?ue.length:0;let Ue=0;K.morphAttributes.position!==void 0&&(Ue=1),K.morphAttributes.normal!==void 0&&(Ue=2),K.morphAttributes.color!==void 0&&(Ue=3);let Ke,q,te,me;if(se){const Xe=Wt[se];Ke=Xe.vertexShader,q=Xe.fragmentShader}else Ke=y.vertexShader,q=y.fragmentShader,c.update(y),te=c.getVertexShaderID(y),me=c.getFragmentShaderID(y);const re=i.getRenderTarget(),ye=i.state.buffers.depth.getReversed(),Ve=z.isInstancedMesh===!0,Ae=z.isBatchedMesh===!0,st=!!y.map,et=!!y.matcap,Fe=!!ee,R=!!y.aoMap,Pt=!!y.lightMap,ze=!!y.bumpMap,Oe=!!y.normalMap,ve=!!y.displacementMap,Je=!!y.emissiveMap,xe=!!y.metalnessMap,b=!!y.roughnessMap,x=y.anisotropy>0,F=y.clearcoat>0,Y=y.dispersion>0,Z=y.iridescence>0,X=y.sheen>0,ge=y.transmission>0,ae=x&&!!y.anisotropyMap,Ee=F&&!!y.clearcoatMap,be=F&&!!y.clearcoatNormalMap,J=F&&!!y.clearcoatRoughnessMap,he=Z&&!!y.iridescenceMap,Te=Z&&!!y.iridescenceThicknessMap,Ce=X&&!!y.sheenColorMap,fe=X&&!!y.sheenRoughnessMap,Be=!!y.specularMap,De=!!y.specularColorMap,Ze=!!y.specularIntensityMap,P=ge&&!!y.transmissionMap,oe=ge&&!!y.thicknessMap,k=!!y.gradientMap,$=!!y.alphaMap,ce=y.alphaTest>0,le=!!y.alphaHash,Ne=!!y.extensions;let tt=_n;y.toneMapped&&(re===null||re.isXRRenderTarget===!0)&&(tt=i.toneMapping);const mt={shaderID:se,shaderType:y.type,shaderName:y.name,vertexShader:Ke,fragmentShader:q,defines:y.defines,customVertexShaderID:te,customFragmentShaderID:me,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:m,batching:Ae,batchingColor:Ae&&z._colorsTexture!==null,instancing:Ve,instancingColor:Ve&&z.instanceColor!==null,instancingMorph:Ve&&z.morphTexture!==null,supportsVertexTextures:h,outputColorSpace:re===null?i.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:si,alphaToCoverage:!!y.alphaToCoverage,map:st,matcap:et,envMap:Fe,envMapMode:Fe&&ee.mapping,envMapCubeUVHeight:V,aoMap:R,lightMap:Pt,bumpMap:ze,normalMap:Oe,displacementMap:h&&ve,emissiveMap:Je,normalMapObjectSpace:Oe&&y.normalMapType===ol,normalMapTangentSpace:Oe&&y.normalMapType===al,metalnessMap:xe,roughnessMap:b,anisotropy:x,anisotropyMap:ae,clearcoat:F,clearcoatMap:Ee,clearcoatNormalMap:be,clearcoatRoughnessMap:J,dispersion:Y,iridescence:Z,iridescenceMap:he,iridescenceThicknessMap:Te,sheen:X,sheenColorMap:Ce,sheenRoughnessMap:fe,specularMap:Be,specularColorMap:De,specularIntensityMap:Ze,transmission:ge,transmissionMap:P,thicknessMap:oe,gradientMap:k,opaque:y.transparent===!1&&y.blending===Qn&&y.alphaToCoverage===!1,alphaMap:$,alphaTest:ce,alphaHash:le,combine:y.combine,mapUv:st&&S(y.map.channel),aoMapUv:R&&S(y.aoMap.channel),lightMapUv:Pt&&S(y.lightMap.channel),bumpMapUv:ze&&S(y.bumpMap.channel),normalMapUv:Oe&&S(y.normalMap.channel),displacementMapUv:ve&&S(y.displacementMap.channel),emissiveMapUv:Je&&S(y.emissiveMap.channel),metalnessMapUv:xe&&S(y.metalnessMap.channel),roughnessMapUv:b&&S(y.roughnessMap.channel),anisotropyMapUv:ae&&S(y.anisotropyMap.channel),clearcoatMapUv:Ee&&S(y.clearcoatMap.channel),clearcoatNormalMapUv:be&&S(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:J&&S(y.clearcoatRoughnessMap.channel),iridescenceMapUv:he&&S(y.iridescenceMap.channel),iridescenceThicknessMapUv:Te&&S(y.iridescenceThicknessMap.channel),sheenColorMapUv:Ce&&S(y.sheenColorMap.channel),sheenRoughnessMapUv:fe&&S(y.sheenRoughnessMap.channel),specularMapUv:Be&&S(y.specularMap.channel),specularColorMapUv:De&&S(y.specularColorMap.channel),specularIntensityMapUv:Ze&&S(y.specularIntensityMap.channel),transmissionMapUv:P&&S(y.transmissionMap.channel),thicknessMapUv:oe&&S(y.thicknessMap.channel),alphaMapUv:$&&S(y.alphaMap.channel),vertexTangents:!!K.attributes.tangent&&(Oe||x),vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!K.attributes.color&&K.attributes.color.itemSize===4,pointsUvs:z.isPoints===!0&&!!K.attributes.uv&&(st||$),fog:!!j,useFog:y.fog===!0,fogExp2:!!j&&j.isFogExp2,flatShading:y.flatShading===!0,sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:p,reverseDepthBuffer:ye,skinning:z.isSkinnedMesh===!0,morphTargets:K.morphAttributes.position!==void 0,morphNormals:K.morphAttributes.normal!==void 0,morphColors:K.morphAttributes.color!==void 0,morphTargetsCount:_e,morphTextureStride:Ue,numDirLights:M.directional.length,numPointLights:M.point.length,numSpotLights:M.spot.length,numSpotLightMaps:M.spotLightMap.length,numRectAreaLights:M.rectArea.length,numHemiLights:M.hemi.length,numDirLightShadows:M.directionalShadowMap.length,numPointLightShadows:M.pointShadowMap.length,numSpotLightShadows:M.spotShadowMap.length,numSpotLightShadowsWithMaps:M.numSpotLightShadowsWithMaps,numLightProbes:M.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&N.length>0,shadowMapType:i.shadowMap.type,toneMapping:tt,decodeVideoTexture:st&&y.map.isVideoTexture===!0&&ke.getTransfer(y.map.colorSpace)===qe,decodeVideoTextureEmissive:Je&&y.emissiveMap.isVideoTexture===!0&&ke.getTransfer(y.emissiveMap.colorSpace)===qe,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===tn,flipSided:y.side===bt,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:Ne&&y.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Ne&&y.extensions.multiDraw===!0||Ae)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return mt.vertexUv1s=d.has(1),mt.vertexUv2s=d.has(2),mt.vertexUv3s=d.has(3),d.clear(),mt}function u(y){const M=[];if(y.shaderID?M.push(y.shaderID):(M.push(y.customVertexShaderID),M.push(y.customFragmentShaderID)),y.defines!==void 0)for(const N in y.defines)M.push(N),M.push(y.defines[N]);return y.isRawShaderMaterial===!1&&(A(M,y),T(M,y),M.push(i.outputColorSpace)),M.push(y.customProgramCacheKey),M.join()}function A(y,M){y.push(M.precision),y.push(M.outputColorSpace),y.push(M.envMapMode),y.push(M.envMapCubeUVHeight),y.push(M.mapUv),y.push(M.alphaMapUv),y.push(M.lightMapUv),y.push(M.aoMapUv),y.push(M.bumpMapUv),y.push(M.normalMapUv),y.push(M.displacementMapUv),y.push(M.emissiveMapUv),y.push(M.metalnessMapUv),y.push(M.roughnessMapUv),y.push(M.anisotropyMapUv),y.push(M.clearcoatMapUv),y.push(M.clearcoatNormalMapUv),y.push(M.clearcoatRoughnessMapUv),y.push(M.iridescenceMapUv),y.push(M.iridescenceThicknessMapUv),y.push(M.sheenColorMapUv),y.push(M.sheenRoughnessMapUv),y.push(M.specularMapUv),y.push(M.specularColorMapUv),y.push(M.specularIntensityMapUv),y.push(M.transmissionMapUv),y.push(M.thicknessMapUv),y.push(M.combine),y.push(M.fogExp2),y.push(M.sizeAttenuation),y.push(M.morphTargetsCount),y.push(M.morphAttributeCount),y.push(M.numDirLights),y.push(M.numPointLights),y.push(M.numSpotLights),y.push(M.numSpotLightMaps),y.push(M.numHemiLights),y.push(M.numRectAreaLights),y.push(M.numDirLightShadows),y.push(M.numPointLightShadows),y.push(M.numSpotLightShadows),y.push(M.numSpotLightShadowsWithMaps),y.push(M.numLightProbes),y.push(M.shadowMapType),y.push(M.toneMapping),y.push(M.numClippingPlanes),y.push(M.numClipIntersection),y.push(M.depthPacking)}function T(y,M){o.disableAll(),M.supportsVertexTextures&&o.enable(0),M.instancing&&o.enable(1),M.instancingColor&&o.enable(2),M.instancingMorph&&o.enable(3),M.matcap&&o.enable(4),M.envMap&&o.enable(5),M.normalMapObjectSpace&&o.enable(6),M.normalMapTangentSpace&&o.enable(7),M.clearcoat&&o.enable(8),M.iridescence&&o.enable(9),M.alphaTest&&o.enable(10),M.vertexColors&&o.enable(11),M.vertexAlphas&&o.enable(12),M.vertexUv1s&&o.enable(13),M.vertexUv2s&&o.enable(14),M.vertexUv3s&&o.enable(15),M.vertexTangents&&o.enable(16),M.anisotropy&&o.enable(17),M.alphaHash&&o.enable(18),M.batching&&o.enable(19),M.dispersion&&o.enable(20),M.batchingColor&&o.enable(21),y.push(o.mask),o.disableAll(),M.fog&&o.enable(0),M.useFog&&o.enable(1),M.flatShading&&o.enable(2),M.logarithmicDepthBuffer&&o.enable(3),M.reverseDepthBuffer&&o.enable(4),M.skinning&&o.enable(5),M.morphTargets&&o.enable(6),M.morphNormals&&o.enable(7),M.morphColors&&o.enable(8),M.premultipliedAlpha&&o.enable(9),M.shadowMapEnabled&&o.enable(10),M.doubleSided&&o.enable(11),M.flipSided&&o.enable(12),M.useDepthPacking&&o.enable(13),M.dithering&&o.enable(14),M.transmission&&o.enable(15),M.sheen&&o.enable(16),M.opaque&&o.enable(17),M.pointsUvs&&o.enable(18),M.decodeVideoTexture&&o.enable(19),M.decodeVideoTextureEmissive&&o.enable(20),M.alphaToCoverage&&o.enable(21),y.push(o.mask)}function E(y){const M=_[y.type];let N;if(M){const H=Wt[M];N=zl.clone(H.uniforms)}else N=y.uniforms;return N}function D(y,M){let N;for(let H=0,z=f.length;H<z;H++){const j=f[H];if(j.cacheKey===M){N=j,++N.usedTimes;break}}return N===void 0&&(N=new of(i,M,y,r),f.push(N)),N}function C(y){if(--y.usedTimes===0){const M=f.indexOf(y);f[M]=f[f.length-1],f.pop(),y.destroy()}}function w(y){c.remove(y)}function L(){c.dispose()}return{getParameters:g,getProgramCacheKey:u,getUniforms:E,acquireProgram:D,releaseProgram:C,releaseShaderCache:w,programs:f,dispose:L}}function hf(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function ff(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function za(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Ga(){const i=[];let e=0;const t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function a(p,h,m,_,S,g){let u=i[e];return u===void 0?(u={id:p.id,object:p,geometry:h,material:m,groupOrder:_,renderOrder:p.renderOrder,z:S,group:g},i[e]=u):(u.id=p.id,u.object=p,u.geometry=h,u.material=m,u.groupOrder=_,u.renderOrder=p.renderOrder,u.z=S,u.group=g),e++,u}function o(p,h,m,_,S,g){const u=a(p,h,m,_,S,g);m.transmission>0?n.push(u):m.transparent===!0?s.push(u):t.push(u)}function c(p,h,m,_,S,g){const u=a(p,h,m,_,S,g);m.transmission>0?n.unshift(u):m.transparent===!0?s.unshift(u):t.unshift(u)}function d(p,h){t.length>1&&t.sort(p||ff),n.length>1&&n.sort(h||za),s.length>1&&s.sort(h||za)}function f(){for(let p=e,h=i.length;p<h;p++){const m=i[p];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:o,unshift:c,finish:f,sort:d}}function pf(){let i=new WeakMap;function e(n,s){const r=i.get(n);let a;return r===void 0?(a=new Ga,i.set(n,[a])):s>=r.length?(a=new Ga,r.push(a)):a=r[s],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function mf(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new O,color:new Ye};break;case"SpotLight":t={position:new O,direction:new O,color:new Ye,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new O,color:new Ye,distance:0,decay:0};break;case"HemisphereLight":t={direction:new O,skyColor:new Ye,groundColor:new Ye};break;case"RectAreaLight":t={color:new Ye,position:new O,halfWidth:new O,halfHeight:new O};break}return i[e.id]=t,t}}}function gf(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new $e,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let xf=0;function _f(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function vf(i){const e=new mf,t=gf(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let d=0;d<9;d++)n.probe.push(new O);const s=new O,r=new lt,a=new lt;function o(d){let f=0,p=0,h=0;for(let y=0;y<9;y++)n.probe[y].set(0,0,0);let m=0,_=0,S=0,g=0,u=0,A=0,T=0,E=0,D=0,C=0,w=0;d.sort(_f);for(let y=0,M=d.length;y<M;y++){const N=d[y],H=N.color,z=N.intensity,j=N.distance,K=N.shadow&&N.shadow.map?N.shadow.map.texture:null;if(N.isAmbientLight)f+=H.r*z,p+=H.g*z,h+=H.b*z;else if(N.isLightProbe){for(let W=0;W<9;W++)n.probe[W].addScaledVector(N.sh.coefficients[W],z);w++}else if(N.isDirectionalLight){const W=e.get(N);if(W.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){const ee=N.shadow,V=t.get(N);V.shadowIntensity=ee.intensity,V.shadowBias=ee.bias,V.shadowNormalBias=ee.normalBias,V.shadowRadius=ee.radius,V.shadowMapSize=ee.mapSize,n.directionalShadow[m]=V,n.directionalShadowMap[m]=K,n.directionalShadowMatrix[m]=N.shadow.matrix,A++}n.directional[m]=W,m++}else if(N.isSpotLight){const W=e.get(N);W.position.setFromMatrixPosition(N.matrixWorld),W.color.copy(H).multiplyScalar(z),W.distance=j,W.coneCos=Math.cos(N.angle),W.penumbraCos=Math.cos(N.angle*(1-N.penumbra)),W.decay=N.decay,n.spot[S]=W;const ee=N.shadow;if(N.map&&(n.spotLightMap[D]=N.map,D++,ee.updateMatrices(N),N.castShadow&&C++),n.spotLightMatrix[S]=ee.matrix,N.castShadow){const V=t.get(N);V.shadowIntensity=ee.intensity,V.shadowBias=ee.bias,V.shadowNormalBias=ee.normalBias,V.shadowRadius=ee.radius,V.shadowMapSize=ee.mapSize,n.spotShadow[S]=V,n.spotShadowMap[S]=K,E++}S++}else if(N.isRectAreaLight){const W=e.get(N);W.color.copy(H).multiplyScalar(z),W.halfWidth.set(N.width*.5,0,0),W.halfHeight.set(0,N.height*.5,0),n.rectArea[g]=W,g++}else if(N.isPointLight){const W=e.get(N);if(W.color.copy(N.color).multiplyScalar(N.intensity),W.distance=N.distance,W.decay=N.decay,N.castShadow){const ee=N.shadow,V=t.get(N);V.shadowIntensity=ee.intensity,V.shadowBias=ee.bias,V.shadowNormalBias=ee.normalBias,V.shadowRadius=ee.radius,V.shadowMapSize=ee.mapSize,V.shadowCameraNear=ee.camera.near,V.shadowCameraFar=ee.camera.far,n.pointShadow[_]=V,n.pointShadowMap[_]=K,n.pointShadowMatrix[_]=N.shadow.matrix,T++}n.point[_]=W,_++}else if(N.isHemisphereLight){const W=e.get(N);W.skyColor.copy(N.color).multiplyScalar(z),W.groundColor.copy(N.groundColor).multiplyScalar(z),n.hemi[u]=W,u++}}g>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ne.LTC_FLOAT_1,n.rectAreaLTC2=ne.LTC_FLOAT_2):(n.rectAreaLTC1=ne.LTC_HALF_1,n.rectAreaLTC2=ne.LTC_HALF_2)),n.ambient[0]=f,n.ambient[1]=p,n.ambient[2]=h;const L=n.hash;(L.directionalLength!==m||L.pointLength!==_||L.spotLength!==S||L.rectAreaLength!==g||L.hemiLength!==u||L.numDirectionalShadows!==A||L.numPointShadows!==T||L.numSpotShadows!==E||L.numSpotMaps!==D||L.numLightProbes!==w)&&(n.directional.length=m,n.spot.length=S,n.rectArea.length=g,n.point.length=_,n.hemi.length=u,n.directionalShadow.length=A,n.directionalShadowMap.length=A,n.pointShadow.length=T,n.pointShadowMap.length=T,n.spotShadow.length=E,n.spotShadowMap.length=E,n.directionalShadowMatrix.length=A,n.pointShadowMatrix.length=T,n.spotLightMatrix.length=E+D-C,n.spotLightMap.length=D,n.numSpotLightShadowsWithMaps=C,n.numLightProbes=w,L.directionalLength=m,L.pointLength=_,L.spotLength=S,L.rectAreaLength=g,L.hemiLength=u,L.numDirectionalShadows=A,L.numPointShadows=T,L.numSpotShadows=E,L.numSpotMaps=D,L.numLightProbes=w,n.version=xf++)}function c(d,f){let p=0,h=0,m=0,_=0,S=0;const g=f.matrixWorldInverse;for(let u=0,A=d.length;u<A;u++){const T=d[u];if(T.isDirectionalLight){const E=n.directional[p];E.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(g),p++}else if(T.isSpotLight){const E=n.spot[m];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(g),E.direction.setFromMatrixPosition(T.matrixWorld),s.setFromMatrixPosition(T.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(g),m++}else if(T.isRectAreaLight){const E=n.rectArea[_];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(g),a.identity(),r.copy(T.matrixWorld),r.premultiply(g),a.extractRotation(r),E.halfWidth.set(T.width*.5,0,0),E.halfHeight.set(0,T.height*.5,0),E.halfWidth.applyMatrix4(a),E.halfHeight.applyMatrix4(a),_++}else if(T.isPointLight){const E=n.point[h];E.position.setFromMatrixPosition(T.matrixWorld),E.position.applyMatrix4(g),h++}else if(T.isHemisphereLight){const E=n.hemi[S];E.direction.setFromMatrixPosition(T.matrixWorld),E.direction.transformDirection(g),S++}}}return{setup:o,setupView:c,state:n}}function Ha(i){const e=new vf(i),t=[],n=[];function s(f){d.camera=f,t.length=0,n.length=0}function r(f){t.push(f)}function a(f){n.push(f)}function o(){e.setup(t)}function c(f){e.setupView(t,f)}const d={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:d,setupLights:o,setupLightsView:c,pushLight:r,pushShadow:a}}function Mf(i){let e=new WeakMap;function t(s,r=0){const a=e.get(s);let o;return a===void 0?(o=new Ha(i),e.set(s,[o])):r>=a.length?(o=new Ha(i),a.push(o)):o=a[r],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const Sf=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,yf=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Ef(i,e,t){let n=new co;const s=new $e,r=new $e,a=new rt,o=new Yl({depthPacking:rl}),c=new $l,d={},f=t.maxTextureSize,p={[vn]:bt,[bt]:vn,[tn]:tn},h=new Mn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new $e},radius:{value:4}},vertexShader:Sf,fragmentShader:yf}),m=h.clone();m.defines.HORIZONTAL_PASS=1;const _=new ln;_.setAttribute("position",new qt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new Rt(_,h),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=ka;let u=this.type;this.render=function(C,w,L){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||C.length===0)return;const y=i.getRenderTarget(),M=i.getActiveCubeFace(),N=i.getActiveMipmapLevel(),H=i.state;H.setBlending(xn),H.buffers.color.setClear(1,1,1,1),H.buffers.depth.setTest(!0),H.setScissorTest(!1);const z=u!==en&&this.type===en,j=u===en&&this.type!==en;for(let K=0,W=C.length;K<W;K++){const ee=C[K],V=ee.shadow;if(V===void 0){console.warn("THREE.WebGLShadowMap:",ee,"has no shadow.");continue}if(V.autoUpdate===!1&&V.needsUpdate===!1)continue;s.copy(V.mapSize);const se=V.getFrameExtents();if(s.multiply(se),r.copy(V.mapSize),(s.x>f||s.y>f)&&(s.x>f&&(r.x=Math.floor(f/se.x),s.x=r.x*se.x,V.mapSize.x=r.x),s.y>f&&(r.y=Math.floor(f/se.y),s.y=r.y*se.y,V.mapSize.y=r.y)),V.map===null||z===!0||j===!0){const _e=this.type!==en?{minFilter:jt,magFilter:jt}:{};V.map!==null&&V.map.dispose(),V.map=new Fn(s.x,s.y,_e),V.map.texture.name=ee.name+".shadowMap",V.camera.updateProjectionMatrix()}i.setRenderTarget(V.map),i.clear();const ue=V.getViewportCount();for(let _e=0;_e<ue;_e++){const Ue=V.getViewport(_e);a.set(r.x*Ue.x,r.y*Ue.y,r.x*Ue.z,r.y*Ue.w),H.viewport(a),V.updateMatrices(ee,_e),n=V.getFrustum(),E(w,L,V.camera,ee,this.type)}V.isPointLightShadow!==!0&&this.type===en&&A(V,L),V.needsUpdate=!1}u=this.type,g.needsUpdate=!1,i.setRenderTarget(y,M,N)};function A(C,w){const L=e.update(S);h.defines.VSM_SAMPLES!==C.blurSamples&&(h.defines.VSM_SAMPLES=C.blurSamples,m.defines.VSM_SAMPLES=C.blurSamples,h.needsUpdate=!0,m.needsUpdate=!0),C.mapPass===null&&(C.mapPass=new Fn(s.x,s.y)),h.uniforms.shadow_pass.value=C.map.texture,h.uniforms.resolution.value=C.mapSize,h.uniforms.radius.value=C.radius,i.setRenderTarget(C.mapPass),i.clear(),i.renderBufferDirect(w,null,L,h,S,null),m.uniforms.shadow_pass.value=C.mapPass.texture,m.uniforms.resolution.value=C.mapSize,m.uniforms.radius.value=C.radius,i.setRenderTarget(C.map),i.clear(),i.renderBufferDirect(w,null,L,m,S,null)}function T(C,w,L,y){let M=null;const N=L.isPointLight===!0?C.customDistanceMaterial:C.customDepthMaterial;if(N!==void 0)M=N;else if(M=L.isPointLight===!0?c:o,i.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0||w.alphaToCoverage===!0){const H=M.uuid,z=w.uuid;let j=d[H];j===void 0&&(j={},d[H]=j);let K=j[z];K===void 0&&(K=M.clone(),j[z]=K,w.addEventListener("dispose",D)),M=K}if(M.visible=w.visible,M.wireframe=w.wireframe,y===en?M.side=w.shadowSide!==null?w.shadowSide:w.side:M.side=w.shadowSide!==null?w.shadowSide:p[w.side],M.alphaMap=w.alphaMap,M.alphaTest=w.alphaToCoverage===!0?.5:w.alphaTest,M.map=w.map,M.clipShadows=w.clipShadows,M.clippingPlanes=w.clippingPlanes,M.clipIntersection=w.clipIntersection,M.displacementMap=w.displacementMap,M.displacementScale=w.displacementScale,M.displacementBias=w.displacementBias,M.wireframeLinewidth=w.wireframeLinewidth,M.linewidth=w.linewidth,L.isPointLight===!0&&M.isMeshDistanceMaterial===!0){const H=i.properties.get(M);H.light=L}return M}function E(C,w,L,y,M){if(C.visible===!1)return;if(C.layers.test(w.layers)&&(C.isMesh||C.isLine||C.isPoints)&&(C.castShadow||C.receiveShadow&&M===en)&&(!C.frustumCulled||n.intersectsObject(C))){C.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,C.matrixWorld);const z=e.update(C),j=C.material;if(Array.isArray(j)){const K=z.groups;for(let W=0,ee=K.length;W<ee;W++){const V=K[W],se=j[V.materialIndex];if(se&&se.visible){const ue=T(C,se,y,M);C.onBeforeShadow(i,C,w,L,z,ue,V),i.renderBufferDirect(L,null,z,ue,C,V),C.onAfterShadow(i,C,w,L,z,ue,V)}}}else if(j.visible){const K=T(C,j,y,M);C.onBeforeShadow(i,C,w,L,z,K,null),i.renderBufferDirect(L,null,z,K,C,null),C.onAfterShadow(i,C,w,L,z,K,null)}}const H=C.children;for(let z=0,j=H.length;z<j;z++)E(H[z],w,L,y,M)}function D(C){C.target.removeEventListener("dispose",D);for(const L in d){const y=d[L],M=C.target.uuid;M in y&&(y[M].dispose(),delete y[M])}}}const bf={[Vs]:js,[Ws]:Ys,[Xs]:$s,[ti]:qs,[js]:Vs,[Ys]:Ws,[$s]:Xs,[qs]:ti};function Tf(i,e){function t(){let P=!1;const oe=new rt;let k=null;const $=new rt(0,0,0,0);return{setMask:function(ce){k!==ce&&!P&&(i.colorMask(ce,ce,ce,ce),k=ce)},setLocked:function(ce){P=ce},setClear:function(ce,le,Ne,tt,mt){mt===!0&&(ce*=tt,le*=tt,Ne*=tt),oe.set(ce,le,Ne,tt),$.equals(oe)===!1&&(i.clearColor(ce,le,Ne,tt),$.copy(oe))},reset:function(){P=!1,k=null,$.set(-1,0,0,0)}}}function n(){let P=!1,oe=!1,k=null,$=null,ce=null;return{setReversed:function(le){if(oe!==le){const Ne=e.get("EXT_clip_control");le?Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.ZERO_TO_ONE_EXT):Ne.clipControlEXT(Ne.LOWER_LEFT_EXT,Ne.NEGATIVE_ONE_TO_ONE_EXT),oe=le;const tt=ce;ce=null,this.setClear(tt)}},getReversed:function(){return oe},setTest:function(le){le?re(i.DEPTH_TEST):ye(i.DEPTH_TEST)},setMask:function(le){k!==le&&!P&&(i.depthMask(le),k=le)},setFunc:function(le){if(oe&&(le=bf[le]),$!==le){switch(le){case Vs:i.depthFunc(i.NEVER);break;case js:i.depthFunc(i.ALWAYS);break;case Ws:i.depthFunc(i.LESS);break;case ti:i.depthFunc(i.LEQUAL);break;case Xs:i.depthFunc(i.EQUAL);break;case qs:i.depthFunc(i.GEQUAL);break;case Ys:i.depthFunc(i.GREATER);break;case $s:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}$=le}},setLocked:function(le){P=le},setClear:function(le){ce!==le&&(oe&&(le=1-le),i.clearDepth(le),ce=le)},reset:function(){P=!1,k=null,$=null,ce=null,oe=!1}}}function s(){let P=!1,oe=null,k=null,$=null,ce=null,le=null,Ne=null,tt=null,mt=null;return{setTest:function(Xe){P||(Xe?re(i.STENCIL_TEST):ye(i.STENCIL_TEST))},setMask:function(Xe){oe!==Xe&&!P&&(i.stencilMask(Xe),oe=Xe)},setFunc:function(Xe,Ot,Yt){(k!==Xe||$!==Ot||ce!==Yt)&&(i.stencilFunc(Xe,Ot,Yt),k=Xe,$=Ot,ce=Yt)},setOp:function(Xe,Ot,Yt){(le!==Xe||Ne!==Ot||tt!==Yt)&&(i.stencilOp(Xe,Ot,Yt),le=Xe,Ne=Ot,tt=Yt)},setLocked:function(Xe){P=Xe},setClear:function(Xe){mt!==Xe&&(i.clearStencil(Xe),mt=Xe)},reset:function(){P=!1,oe=null,k=null,$=null,ce=null,le=null,Ne=null,tt=null,mt=null}}}const r=new t,a=new n,o=new s,c=new WeakMap,d=new WeakMap;let f={},p={},h=new WeakMap,m=[],_=null,S=!1,g=null,u=null,A=null,T=null,E=null,D=null,C=null,w=new Ye(0,0,0),L=0,y=!1,M=null,N=null,H=null,z=null,j=null;const K=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let W=!1,ee=0;const V=i.getParameter(i.VERSION);V.indexOf("WebGL")!==-1?(ee=parseFloat(/^WebGL (\d)/.exec(V)[1]),W=ee>=1):V.indexOf("OpenGL ES")!==-1&&(ee=parseFloat(/^OpenGL ES (\d)/.exec(V)[1]),W=ee>=2);let se=null,ue={};const _e=i.getParameter(i.SCISSOR_BOX),Ue=i.getParameter(i.VIEWPORT),Ke=new rt().fromArray(_e),q=new rt().fromArray(Ue);function te(P,oe,k,$){const ce=new Uint8Array(4),le=i.createTexture();i.bindTexture(P,le),i.texParameteri(P,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(P,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Ne=0;Ne<k;Ne++)P===i.TEXTURE_3D||P===i.TEXTURE_2D_ARRAY?i.texImage3D(oe,0,i.RGBA,1,1,$,0,i.RGBA,i.UNSIGNED_BYTE,ce):i.texImage2D(oe+Ne,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ce);return le}const me={};me[i.TEXTURE_2D]=te(i.TEXTURE_2D,i.TEXTURE_2D,1),me[i.TEXTURE_CUBE_MAP]=te(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),me[i.TEXTURE_2D_ARRAY]=te(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),me[i.TEXTURE_3D]=te(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),re(i.DEPTH_TEST),a.setFunc(ti),ze(!1),Oe(qr),re(i.CULL_FACE),R(xn);function re(P){f[P]!==!0&&(i.enable(P),f[P]=!0)}function ye(P){f[P]!==!1&&(i.disable(P),f[P]=!1)}function Ve(P,oe){return p[P]!==oe?(i.bindFramebuffer(P,oe),p[P]=oe,P===i.DRAW_FRAMEBUFFER&&(p[i.FRAMEBUFFER]=oe),P===i.FRAMEBUFFER&&(p[i.DRAW_FRAMEBUFFER]=oe),!0):!1}function Ae(P,oe){let k=m,$=!1;if(P){k=h.get(oe),k===void 0&&(k=[],h.set(oe,k));const ce=P.textures;if(k.length!==ce.length||k[0]!==i.COLOR_ATTACHMENT0){for(let le=0,Ne=ce.length;le<Ne;le++)k[le]=i.COLOR_ATTACHMENT0+le;k.length=ce.length,$=!0}}else k[0]!==i.BACK&&(k[0]=i.BACK,$=!0);$&&i.drawBuffers(k)}function st(P){return _!==P?(i.useProgram(P),_=P,!0):!1}const et={[Pn]:i.FUNC_ADD,[Po]:i.FUNC_SUBTRACT,[Do]:i.FUNC_REVERSE_SUBTRACT};et[Lo]=i.MIN,et[Uo]=i.MAX;const Fe={[Io]:i.ZERO,[Fo]:i.ONE,[Oo]:i.SRC_COLOR,[Hs]:i.SRC_ALPHA,[Vo]:i.SRC_ALPHA_SATURATE,[Ho]:i.DST_COLOR,[zo]:i.DST_ALPHA,[Bo]:i.ONE_MINUS_SRC_COLOR,[ks]:i.ONE_MINUS_SRC_ALPHA,[ko]:i.ONE_MINUS_DST_COLOR,[Go]:i.ONE_MINUS_DST_ALPHA,[jo]:i.CONSTANT_COLOR,[Wo]:i.ONE_MINUS_CONSTANT_COLOR,[Xo]:i.CONSTANT_ALPHA,[qo]:i.ONE_MINUS_CONSTANT_ALPHA};function R(P,oe,k,$,ce,le,Ne,tt,mt,Xe){if(P===xn){S===!0&&(ye(i.BLEND),S=!1);return}if(S===!1&&(re(i.BLEND),S=!0),P!==No){if(P!==g||Xe!==y){if((u!==Pn||E!==Pn)&&(i.blendEquation(i.FUNC_ADD),u=Pn,E=Pn),Xe)switch(P){case Qn:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yr:i.blendFunc(i.ONE,i.ONE);break;case $r:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Kr:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}else switch(P){case Qn:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Yr:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case $r:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Kr:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",P);break}A=null,T=null,D=null,C=null,w.set(0,0,0),L=0,g=P,y=Xe}return}ce=ce||oe,le=le||k,Ne=Ne||$,(oe!==u||ce!==E)&&(i.blendEquationSeparate(et[oe],et[ce]),u=oe,E=ce),(k!==A||$!==T||le!==D||Ne!==C)&&(i.blendFuncSeparate(Fe[k],Fe[$],Fe[le],Fe[Ne]),A=k,T=$,D=le,C=Ne),(tt.equals(w)===!1||mt!==L)&&(i.blendColor(tt.r,tt.g,tt.b,mt),w.copy(tt),L=mt),g=P,y=!1}function Pt(P,oe){P.side===tn?ye(i.CULL_FACE):re(i.CULL_FACE);let k=P.side===bt;oe&&(k=!k),ze(k),P.blending===Qn&&P.transparent===!1?R(xn):R(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),a.setFunc(P.depthFunc),a.setTest(P.depthTest),a.setMask(P.depthWrite),r.setMask(P.colorWrite);const $=P.stencilWrite;o.setTest($),$&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),Je(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?re(i.SAMPLE_ALPHA_TO_COVERAGE):ye(i.SAMPLE_ALPHA_TO_COVERAGE)}function ze(P){M!==P&&(P?i.frontFace(i.CW):i.frontFace(i.CCW),M=P)}function Oe(P){P!==wo?(re(i.CULL_FACE),P!==N&&(P===qr?i.cullFace(i.BACK):P===Co?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):ye(i.CULL_FACE),N=P}function ve(P){P!==H&&(W&&i.lineWidth(P),H=P)}function Je(P,oe,k){P?(re(i.POLYGON_OFFSET_FILL),(z!==oe||j!==k)&&(i.polygonOffset(oe,k),z=oe,j=k)):ye(i.POLYGON_OFFSET_FILL)}function xe(P){P?re(i.SCISSOR_TEST):ye(i.SCISSOR_TEST)}function b(P){P===void 0&&(P=i.TEXTURE0+K-1),se!==P&&(i.activeTexture(P),se=P)}function x(P,oe,k){k===void 0&&(se===null?k=i.TEXTURE0+K-1:k=se);let $=ue[k];$===void 0&&($={type:void 0,texture:void 0},ue[k]=$),($.type!==P||$.texture!==oe)&&(se!==k&&(i.activeTexture(k),se=k),i.bindTexture(P,oe||me[P]),$.type=P,$.texture=oe)}function F(){const P=ue[se];P!==void 0&&P.type!==void 0&&(i.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function Y(){try{i.compressedTexImage2D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Z(){try{i.compressedTexImage3D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function X(){try{i.texSubImage2D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ge(){try{i.texSubImage3D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function ae(){try{i.compressedTexSubImage2D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ee(){try{i.compressedTexSubImage3D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function be(){try{i.texStorage2D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function J(){try{i.texStorage3D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function he(){try{i.texImage2D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Te(){try{i.texImage3D(...arguments)}catch(P){console.error("THREE.WebGLState:",P)}}function Ce(P){Ke.equals(P)===!1&&(i.scissor(P.x,P.y,P.z,P.w),Ke.copy(P))}function fe(P){q.equals(P)===!1&&(i.viewport(P.x,P.y,P.z,P.w),q.copy(P))}function Be(P,oe){let k=d.get(oe);k===void 0&&(k=new WeakMap,d.set(oe,k));let $=k.get(P);$===void 0&&($=i.getUniformBlockIndex(oe,P.name),k.set(P,$))}function De(P,oe){const $=d.get(oe).get(P);c.get(oe)!==$&&(i.uniformBlockBinding(oe,$,P.__bindingPointIndex),c.set(oe,$))}function Ze(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),f={},se=null,ue={},p={},h=new WeakMap,m=[],_=null,S=!1,g=null,u=null,A=null,T=null,E=null,D=null,C=null,w=new Ye(0,0,0),L=0,y=!1,M=null,N=null,H=null,z=null,j=null,Ke.set(0,0,i.canvas.width,i.canvas.height),q.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:re,disable:ye,bindFramebuffer:Ve,drawBuffers:Ae,useProgram:st,setBlending:R,setMaterial:Pt,setFlipSided:ze,setCullFace:Oe,setLineWidth:ve,setPolygonOffset:Je,setScissorTest:xe,activeTexture:b,bindTexture:x,unbindTexture:F,compressedTexImage2D:Y,compressedTexImage3D:Z,texImage2D:he,texImage3D:Te,updateUBOMapping:Be,uniformBlockBinding:De,texStorage2D:be,texStorage3D:J,texSubImage2D:X,texSubImage3D:ge,compressedTexSubImage2D:ae,compressedTexSubImage3D:Ee,scissor:Ce,viewport:fe,reset:Ze}}function Af(i,e,t,n,s,r,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),d=new $e,f=new WeakMap;let p;const h=new WeakMap;let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function _(b,x){return m?new OffscreenCanvas(b,x):ss("canvas")}function S(b,x,F){let Y=1;const Z=xe(b);if((Z.width>F||Z.height>F)&&(Y=F/Math.max(Z.width,Z.height)),Y<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){const X=Math.floor(Y*Z.width),ge=Math.floor(Y*Z.height);p===void 0&&(p=_(X,ge));const ae=x?_(X,ge):p;return ae.width=X,ae.height=ge,ae.getContext("2d").drawImage(b,0,0,X,ge),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+X+"x"+ge+")."),ae}else return"data"in b&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),b;return b}function g(b){return b.generateMipmaps}function u(b){i.generateMipmap(b)}function A(b){return b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?i.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function T(b,x,F,Y,Z=!1){if(b!==null){if(i[b]!==void 0)return i[b];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let X=x;if(x===i.RED&&(F===i.FLOAT&&(X=i.R32F),F===i.HALF_FLOAT&&(X=i.R16F),F===i.UNSIGNED_BYTE&&(X=i.R8)),x===i.RED_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.R8UI),F===i.UNSIGNED_SHORT&&(X=i.R16UI),F===i.UNSIGNED_INT&&(X=i.R32UI),F===i.BYTE&&(X=i.R8I),F===i.SHORT&&(X=i.R16I),F===i.INT&&(X=i.R32I)),x===i.RG&&(F===i.FLOAT&&(X=i.RG32F),F===i.HALF_FLOAT&&(X=i.RG16F),F===i.UNSIGNED_BYTE&&(X=i.RG8)),x===i.RG_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RG8UI),F===i.UNSIGNED_SHORT&&(X=i.RG16UI),F===i.UNSIGNED_INT&&(X=i.RG32UI),F===i.BYTE&&(X=i.RG8I),F===i.SHORT&&(X=i.RG16I),F===i.INT&&(X=i.RG32I)),x===i.RGB_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RGB8UI),F===i.UNSIGNED_SHORT&&(X=i.RGB16UI),F===i.UNSIGNED_INT&&(X=i.RGB32UI),F===i.BYTE&&(X=i.RGB8I),F===i.SHORT&&(X=i.RGB16I),F===i.INT&&(X=i.RGB32I)),x===i.RGBA_INTEGER&&(F===i.UNSIGNED_BYTE&&(X=i.RGBA8UI),F===i.UNSIGNED_SHORT&&(X=i.RGBA16UI),F===i.UNSIGNED_INT&&(X=i.RGBA32UI),F===i.BYTE&&(X=i.RGBA8I),F===i.SHORT&&(X=i.RGBA16I),F===i.INT&&(X=i.RGBA32I)),x===i.RGB&&F===i.UNSIGNED_INT_5_9_9_9_REV&&(X=i.RGB9_E5),x===i.RGBA){const ge=Z?ns:ke.getTransfer(Y);F===i.FLOAT&&(X=i.RGBA32F),F===i.HALF_FLOAT&&(X=i.RGBA16F),F===i.UNSIGNED_BYTE&&(X=ge===qe?i.SRGB8_ALPHA8:i.RGBA8),F===i.UNSIGNED_SHORT_4_4_4_4&&(X=i.RGBA4),F===i.UNSIGNED_SHORT_5_5_5_1&&(X=i.RGB5_A1)}return(X===i.R16F||X===i.R32F||X===i.RG16F||X===i.RG32F||X===i.RGBA16F||X===i.RGBA32F)&&e.get("EXT_color_buffer_float"),X}function E(b,x){let F;return b?x===null||x===In||x===xi?F=i.DEPTH24_STENCIL8:x===nn?F=i.DEPTH32F_STENCIL8:x===gi&&(F=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===In||x===xi?F=i.DEPTH_COMPONENT24:x===nn?F=i.DEPTH_COMPONENT32F:x===gi&&(F=i.DEPTH_COMPONENT16),F}function D(b,x){return g(b)===!0||b.isFramebufferTexture&&b.minFilter!==jt&&b.minFilter!==Xt?Math.log2(Math.max(x.width,x.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?x.mipmaps.length:1}function C(b){const x=b.target;x.removeEventListener("dispose",C),L(x),x.isVideoTexture&&f.delete(x)}function w(b){const x=b.target;x.removeEventListener("dispose",w),M(x)}function L(b){const x=n.get(b);if(x.__webglInit===void 0)return;const F=b.source,Y=h.get(F);if(Y){const Z=Y[x.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&y(b),Object.keys(Y).length===0&&h.delete(F)}n.remove(b)}function y(b){const x=n.get(b);i.deleteTexture(x.__webglTexture);const F=b.source,Y=h.get(F);delete Y[x.__cacheKey],a.memory.textures--}function M(b){const x=n.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),n.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let Y=0;Y<6;Y++){if(Array.isArray(x.__webglFramebuffer[Y]))for(let Z=0;Z<x.__webglFramebuffer[Y].length;Z++)i.deleteFramebuffer(x.__webglFramebuffer[Y][Z]);else i.deleteFramebuffer(x.__webglFramebuffer[Y]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[Y])}else{if(Array.isArray(x.__webglFramebuffer))for(let Y=0;Y<x.__webglFramebuffer.length;Y++)i.deleteFramebuffer(x.__webglFramebuffer[Y]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let Y=0;Y<x.__webglColorRenderbuffer.length;Y++)x.__webglColorRenderbuffer[Y]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[Y]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const F=b.textures;for(let Y=0,Z=F.length;Y<Z;Y++){const X=n.get(F[Y]);X.__webglTexture&&(i.deleteTexture(X.__webglTexture),a.memory.textures--),n.remove(F[Y])}n.remove(b)}let N=0;function H(){N=0}function z(){const b=N;return b>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+b+" texture units while this GPU supports only "+s.maxTextures),N+=1,b}function j(b){const x=[];return x.push(b.wrapS),x.push(b.wrapT),x.push(b.wrapR||0),x.push(b.magFilter),x.push(b.minFilter),x.push(b.anisotropy),x.push(b.internalFormat),x.push(b.format),x.push(b.type),x.push(b.generateMipmaps),x.push(b.premultiplyAlpha),x.push(b.flipY),x.push(b.unpackAlignment),x.push(b.colorSpace),x.join()}function K(b,x){const F=n.get(b);if(b.isVideoTexture&&ve(b),b.isRenderTargetTexture===!1&&b.version>0&&F.__version!==b.version){const Y=b.image;if(Y===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(Y.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{q(F,b,x);return}}t.bindTexture(i.TEXTURE_2D,F.__webglTexture,i.TEXTURE0+x)}function W(b,x){const F=n.get(b);if(b.version>0&&F.__version!==b.version){q(F,b,x);return}t.bindTexture(i.TEXTURE_2D_ARRAY,F.__webglTexture,i.TEXTURE0+x)}function ee(b,x){const F=n.get(b);if(b.version>0&&F.__version!==b.version){q(F,b,x);return}t.bindTexture(i.TEXTURE_3D,F.__webglTexture,i.TEXTURE0+x)}function V(b,x){const F=n.get(b);if(b.version>0&&F.__version!==b.version){te(F,b,x);return}t.bindTexture(i.TEXTURE_CUBE_MAP,F.__webglTexture,i.TEXTURE0+x)}const se={[Js]:i.REPEAT,[Ln]:i.CLAMP_TO_EDGE,[Qs]:i.MIRRORED_REPEAT},ue={[jt]:i.NEAREST,[il]:i.NEAREST_MIPMAP_NEAREST,[wi]:i.NEAREST_MIPMAP_LINEAR,[Xt]:i.LINEAR,[us]:i.LINEAR_MIPMAP_NEAREST,[Un]:i.LINEAR_MIPMAP_LINEAR},_e={[ll]:i.NEVER,[pl]:i.ALWAYS,[cl]:i.LESS,[Qa]:i.LEQUAL,[dl]:i.EQUAL,[fl]:i.GEQUAL,[ul]:i.GREATER,[hl]:i.NOTEQUAL};function Ue(b,x){if(x.type===nn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===Xt||x.magFilter===us||x.magFilter===wi||x.magFilter===Un||x.minFilter===Xt||x.minFilter===us||x.minFilter===wi||x.minFilter===Un)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(b,i.TEXTURE_WRAP_S,se[x.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,se[x.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,se[x.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,ue[x.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,ue[x.minFilter]),x.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,_e[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===jt||x.minFilter!==wi&&x.minFilter!==Un||x.type===nn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const F=e.get("EXT_texture_filter_anisotropic");i.texParameterf(b,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function Ke(b,x){let F=!1;b.__webglInit===void 0&&(b.__webglInit=!0,x.addEventListener("dispose",C));const Y=x.source;let Z=h.get(Y);Z===void 0&&(Z={},h.set(Y,Z));const X=j(x);if(X!==b.__cacheKey){Z[X]===void 0&&(Z[X]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,F=!0),Z[X].usedTimes++;const ge=Z[b.__cacheKey];ge!==void 0&&(Z[b.__cacheKey].usedTimes--,ge.usedTimes===0&&y(x)),b.__cacheKey=X,b.__webglTexture=Z[X].texture}return F}function q(b,x,F){let Y=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(Y=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(Y=i.TEXTURE_3D);const Z=Ke(b,x),X=x.source;t.bindTexture(Y,b.__webglTexture,i.TEXTURE0+F);const ge=n.get(X);if(X.version!==ge.__version||Z===!0){t.activeTexture(i.TEXTURE0+F);const ae=ke.getPrimaries(ke.workingColorSpace),Ee=x.colorSpace===gn?null:ke.getPrimaries(x.colorSpace),be=x.colorSpace===gn||ae===Ee?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,be);let J=S(x.image,!1,s.maxTextureSize);J=Je(x,J);const he=r.convert(x.format,x.colorSpace),Te=r.convert(x.type);let Ce=T(x.internalFormat,he,Te,x.colorSpace,x.isVideoTexture);Ue(Y,x);let fe;const Be=x.mipmaps,De=x.isVideoTexture!==!0,Ze=ge.__version===void 0||Z===!0,P=X.dataReady,oe=D(x,J);if(x.isDepthTexture)Ce=E(x.format===vi,x.type),Ze&&(De?t.texStorage2D(i.TEXTURE_2D,1,Ce,J.width,J.height):t.texImage2D(i.TEXTURE_2D,0,Ce,J.width,J.height,0,he,Te,null));else if(x.isDataTexture)if(Be.length>0){De&&Ze&&t.texStorage2D(i.TEXTURE_2D,oe,Ce,Be[0].width,Be[0].height);for(let k=0,$=Be.length;k<$;k++)fe=Be[k],De?P&&t.texSubImage2D(i.TEXTURE_2D,k,0,0,fe.width,fe.height,he,Te,fe.data):t.texImage2D(i.TEXTURE_2D,k,Ce,fe.width,fe.height,0,he,Te,fe.data);x.generateMipmaps=!1}else De?(Ze&&t.texStorage2D(i.TEXTURE_2D,oe,Ce,J.width,J.height),P&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,J.width,J.height,he,Te,J.data)):t.texImage2D(i.TEXTURE_2D,0,Ce,J.width,J.height,0,he,Te,J.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){De&&Ze&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,Ce,Be[0].width,Be[0].height,J.depth);for(let k=0,$=Be.length;k<$;k++)if(fe=Be[k],x.format!==Vt)if(he!==null)if(De){if(P)if(x.layerUpdates.size>0){const ce=xa(fe.width,fe.height,x.format,x.type);for(const le of x.layerUpdates){const Ne=fe.data.subarray(le*ce/fe.data.BYTES_PER_ELEMENT,(le+1)*ce/fe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,k,0,0,le,fe.width,fe.height,1,he,Ne)}x.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,k,0,0,0,fe.width,fe.height,J.depth,he,fe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,k,Ce,fe.width,fe.height,J.depth,0,fe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else De?P&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,k,0,0,0,fe.width,fe.height,J.depth,he,Te,fe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,k,Ce,fe.width,fe.height,J.depth,0,he,Te,fe.data)}else{De&&Ze&&t.texStorage2D(i.TEXTURE_2D,oe,Ce,Be[0].width,Be[0].height);for(let k=0,$=Be.length;k<$;k++)fe=Be[k],x.format!==Vt?he!==null?De?P&&t.compressedTexSubImage2D(i.TEXTURE_2D,k,0,0,fe.width,fe.height,he,fe.data):t.compressedTexImage2D(i.TEXTURE_2D,k,Ce,fe.width,fe.height,0,fe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):De?P&&t.texSubImage2D(i.TEXTURE_2D,k,0,0,fe.width,fe.height,he,Te,fe.data):t.texImage2D(i.TEXTURE_2D,k,Ce,fe.width,fe.height,0,he,Te,fe.data)}else if(x.isDataArrayTexture)if(De){if(Ze&&t.texStorage3D(i.TEXTURE_2D_ARRAY,oe,Ce,J.width,J.height,J.depth),P)if(x.layerUpdates.size>0){const k=xa(J.width,J.height,x.format,x.type);for(const $ of x.layerUpdates){const ce=J.data.subarray($*k/J.data.BYTES_PER_ELEMENT,($+1)*k/J.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,$,J.width,J.height,1,he,Te,ce)}x.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,J.width,J.height,J.depth,he,Te,J.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,Ce,J.width,J.height,J.depth,0,he,Te,J.data);else if(x.isData3DTexture)De?(Ze&&t.texStorage3D(i.TEXTURE_3D,oe,Ce,J.width,J.height,J.depth),P&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,J.width,J.height,J.depth,he,Te,J.data)):t.texImage3D(i.TEXTURE_3D,0,Ce,J.width,J.height,J.depth,0,he,Te,J.data);else if(x.isFramebufferTexture){if(Ze)if(De)t.texStorage2D(i.TEXTURE_2D,oe,Ce,J.width,J.height);else{let k=J.width,$=J.height;for(let ce=0;ce<oe;ce++)t.texImage2D(i.TEXTURE_2D,ce,Ce,k,$,0,he,Te,null),k>>=1,$>>=1}}else if(Be.length>0){if(De&&Ze){const k=xe(Be[0]);t.texStorage2D(i.TEXTURE_2D,oe,Ce,k.width,k.height)}for(let k=0,$=Be.length;k<$;k++)fe=Be[k],De?P&&t.texSubImage2D(i.TEXTURE_2D,k,0,0,he,Te,fe):t.texImage2D(i.TEXTURE_2D,k,Ce,he,Te,fe);x.generateMipmaps=!1}else if(De){if(Ze){const k=xe(J);t.texStorage2D(i.TEXTURE_2D,oe,Ce,k.width,k.height)}P&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,he,Te,J)}else t.texImage2D(i.TEXTURE_2D,0,Ce,he,Te,J);g(x)&&u(Y),ge.__version=X.version,x.onUpdate&&x.onUpdate(x)}b.__version=x.version}function te(b,x,F){if(x.image.length!==6)return;const Y=Ke(b,x),Z=x.source;t.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+F);const X=n.get(Z);if(Z.version!==X.__version||Y===!0){t.activeTexture(i.TEXTURE0+F);const ge=ke.getPrimaries(ke.workingColorSpace),ae=x.colorSpace===gn?null:ke.getPrimaries(x.colorSpace),Ee=x.colorSpace===gn||ge===ae?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee);const be=x.isCompressedTexture||x.image[0].isCompressedTexture,J=x.image[0]&&x.image[0].isDataTexture,he=[];for(let $=0;$<6;$++)!be&&!J?he[$]=S(x.image[$],!0,s.maxCubemapSize):he[$]=J?x.image[$].image:x.image[$],he[$]=Je(x,he[$]);const Te=he[0],Ce=r.convert(x.format,x.colorSpace),fe=r.convert(x.type),Be=T(x.internalFormat,Ce,fe,x.colorSpace),De=x.isVideoTexture!==!0,Ze=X.__version===void 0||Y===!0,P=Z.dataReady;let oe=D(x,Te);Ue(i.TEXTURE_CUBE_MAP,x);let k;if(be){De&&Ze&&t.texStorage2D(i.TEXTURE_CUBE_MAP,oe,Be,Te.width,Te.height);for(let $=0;$<6;$++){k=he[$].mipmaps;for(let ce=0;ce<k.length;ce++){const le=k[ce];x.format!==Vt?Ce!==null?De?P&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,0,0,le.width,le.height,Ce,le.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,Be,le.width,le.height,0,le.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):De?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,0,0,le.width,le.height,Ce,fe,le.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce,Be,le.width,le.height,0,Ce,fe,le.data)}}}else{if(k=x.mipmaps,De&&Ze){k.length>0&&oe++;const $=xe(he[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,oe,Be,$.width,$.height)}for(let $=0;$<6;$++)if(J){De?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,he[$].width,he[$].height,Ce,fe,he[$].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Be,he[$].width,he[$].height,0,Ce,fe,he[$].data);for(let ce=0;ce<k.length;ce++){const Ne=k[ce].image[$].image;De?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,0,0,Ne.width,Ne.height,Ce,fe,Ne.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,Be,Ne.width,Ne.height,0,Ce,fe,Ne.data)}}else{De?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,0,0,Ce,fe,he[$]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0,Be,Ce,fe,he[$]);for(let ce=0;ce<k.length;ce++){const le=k[ce];De?P&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,0,0,Ce,fe,le.image[$]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+$,ce+1,Be,Ce,fe,le.image[$])}}}g(x)&&u(i.TEXTURE_CUBE_MAP),X.__version=Z.version,x.onUpdate&&x.onUpdate(x)}b.__version=x.version}function me(b,x,F,Y,Z,X){const ge=r.convert(F.format,F.colorSpace),ae=r.convert(F.type),Ee=T(F.internalFormat,ge,ae,F.colorSpace),be=n.get(x),J=n.get(F);if(J.__renderTarget=x,!be.__hasExternalTextures){const he=Math.max(1,x.width>>X),Te=Math.max(1,x.height>>X);Z===i.TEXTURE_3D||Z===i.TEXTURE_2D_ARRAY?t.texImage3D(Z,X,Ee,he,Te,x.depth,0,ge,ae,null):t.texImage2D(Z,X,Ee,he,Te,0,ge,ae,null)}t.bindFramebuffer(i.FRAMEBUFFER,b),Oe(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Y,Z,J.__webglTexture,0,ze(x)):(Z===i.TEXTURE_2D||Z>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Y,Z,J.__webglTexture,X),t.bindFramebuffer(i.FRAMEBUFFER,null)}function re(b,x,F){if(i.bindRenderbuffer(i.RENDERBUFFER,b),x.depthBuffer){const Y=x.depthTexture,Z=Y&&Y.isDepthTexture?Y.type:null,X=E(x.stencilBuffer,Z),ge=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ae=ze(x);Oe(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ae,X,x.width,x.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,ae,X,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,X,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ge,i.RENDERBUFFER,b)}else{const Y=x.textures;for(let Z=0;Z<Y.length;Z++){const X=Y[Z],ge=r.convert(X.format,X.colorSpace),ae=r.convert(X.type),Ee=T(X.internalFormat,ge,ae,X.colorSpace),be=ze(x);F&&Oe(x)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,be,Ee,x.width,x.height):Oe(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,be,Ee,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,Ee,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function ye(b,x){if(x&&x.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,b),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");const Y=n.get(x.depthTexture);Y.__renderTarget=x,(!Y.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),K(x.depthTexture,0);const Z=Y.__webglTexture,X=ze(x);if(x.depthTexture.format===_i)Oe(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0);else if(x.depthTexture.format===vi)Oe(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0,X):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function Ve(b){const x=n.get(b),F=b.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==b.depthTexture){const Y=b.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),Y){const Z=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,Y.removeEventListener("dispose",Z)};Y.addEventListener("dispose",Z),x.__depthDisposeCallback=Z}x.__boundDepthTexture=Y}if(b.depthTexture&&!x.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");const Y=b.texture.mipmaps;Y&&Y.length>0?ye(x.__webglFramebuffer[0],b):ye(x.__webglFramebuffer,b)}else if(F){x.__webglDepthbuffer=[];for(let Y=0;Y<6;Y++)if(t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[Y]),x.__webglDepthbuffer[Y]===void 0)x.__webglDepthbuffer[Y]=i.createRenderbuffer(),re(x.__webglDepthbuffer[Y],b,!1);else{const Z=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,X=x.__webglDepthbuffer[Y];i.bindRenderbuffer(i.RENDERBUFFER,X),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,X)}}else{const Y=b.texture.mipmaps;if(Y&&Y.length>0?t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),re(x.__webglDepthbuffer,b,!1);else{const Z=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,X=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,X),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,X)}}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Ae(b,x,F){const Y=n.get(b);x!==void 0&&me(Y.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),F!==void 0&&Ve(b)}function st(b){const x=b.texture,F=n.get(b),Y=n.get(x);b.addEventListener("dispose",w);const Z=b.textures,X=b.isWebGLCubeRenderTarget===!0,ge=Z.length>1;if(ge||(Y.__webglTexture===void 0&&(Y.__webglTexture=i.createTexture()),Y.__version=x.version,a.memory.textures++),X){F.__webglFramebuffer=[];for(let ae=0;ae<6;ae++)if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer[ae]=[];for(let Ee=0;Ee<x.mipmaps.length;Ee++)F.__webglFramebuffer[ae][Ee]=i.createFramebuffer()}else F.__webglFramebuffer[ae]=i.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){F.__webglFramebuffer=[];for(let ae=0;ae<x.mipmaps.length;ae++)F.__webglFramebuffer[ae]=i.createFramebuffer()}else F.__webglFramebuffer=i.createFramebuffer();if(ge)for(let ae=0,Ee=Z.length;ae<Ee;ae++){const be=n.get(Z[ae]);be.__webglTexture===void 0&&(be.__webglTexture=i.createTexture(),a.memory.textures++)}if(b.samples>0&&Oe(b)===!1){F.__webglMultisampledFramebuffer=i.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let ae=0;ae<Z.length;ae++){const Ee=Z[ae];F.__webglColorRenderbuffer[ae]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,F.__webglColorRenderbuffer[ae]);const be=r.convert(Ee.format,Ee.colorSpace),J=r.convert(Ee.type),he=T(Ee.internalFormat,be,J,Ee.colorSpace,b.isXRRenderTarget===!0),Te=ze(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,Te,he,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ae,i.RENDERBUFFER,F.__webglColorRenderbuffer[ae])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(F.__webglDepthRenderbuffer=i.createRenderbuffer(),re(F.__webglDepthRenderbuffer,b,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(X){t.bindTexture(i.TEXTURE_CUBE_MAP,Y.__webglTexture),Ue(i.TEXTURE_CUBE_MAP,x);for(let ae=0;ae<6;ae++)if(x.mipmaps&&x.mipmaps.length>0)for(let Ee=0;Ee<x.mipmaps.length;Ee++)me(F.__webglFramebuffer[ae][Ee],b,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ee);else me(F.__webglFramebuffer[ae],b,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0);g(x)&&u(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ge){for(let ae=0,Ee=Z.length;ae<Ee;ae++){const be=Z[ae],J=n.get(be);t.bindTexture(i.TEXTURE_2D,J.__webglTexture),Ue(i.TEXTURE_2D,be),me(F.__webglFramebuffer,b,be,i.COLOR_ATTACHMENT0+ae,i.TEXTURE_2D,0),g(be)&&u(i.TEXTURE_2D)}t.unbindTexture()}else{let ae=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(ae=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ae,Y.__webglTexture),Ue(ae,x),x.mipmaps&&x.mipmaps.length>0)for(let Ee=0;Ee<x.mipmaps.length;Ee++)me(F.__webglFramebuffer[Ee],b,x,i.COLOR_ATTACHMENT0,ae,Ee);else me(F.__webglFramebuffer,b,x,i.COLOR_ATTACHMENT0,ae,0);g(x)&&u(ae),t.unbindTexture()}b.depthBuffer&&Ve(b)}function et(b){const x=b.textures;for(let F=0,Y=x.length;F<Y;F++){const Z=x[F];if(g(Z)){const X=A(b),ge=n.get(Z).__webglTexture;t.bindTexture(X,ge),u(X),t.unbindTexture()}}}const Fe=[],R=[];function Pt(b){if(b.samples>0){if(Oe(b)===!1){const x=b.textures,F=b.width,Y=b.height;let Z=i.COLOR_BUFFER_BIT;const X=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ge=n.get(b),ae=x.length>1;if(ae)for(let be=0;be<x.length;be++)t.bindFramebuffer(i.FRAMEBUFFER,ge.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ge.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ge.__webglMultisampledFramebuffer);const Ee=b.texture.mipmaps;Ee&&Ee.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ge.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ge.__webglFramebuffer);for(let be=0;be<x.length;be++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(Z|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(Z|=i.STENCIL_BUFFER_BIT)),ae){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ge.__webglColorRenderbuffer[be]);const J=n.get(x[be]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,J,0)}i.blitFramebuffer(0,0,F,Y,0,0,F,Y,Z,i.NEAREST),c===!0&&(Fe.length=0,R.length=0,Fe.push(i.COLOR_ATTACHMENT0+be),b.depthBuffer&&b.resolveDepthBuffer===!1&&(Fe.push(X),R.push(X),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,R)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Fe))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ae)for(let be=0;be<x.length;be++){t.bindFramebuffer(i.FRAMEBUFFER,ge.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.RENDERBUFFER,ge.__webglColorRenderbuffer[be]);const J=n.get(x[be]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ge.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+be,i.TEXTURE_2D,J,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ge.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.resolveDepthBuffer===!1&&c){const x=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function ze(b){return Math.min(s.maxSamples,b.samples)}function Oe(b){const x=n.get(b);return b.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function ve(b){const x=a.render.frame;f.get(b)!==x&&(f.set(b,x),b.update())}function Je(b,x){const F=b.colorSpace,Y=b.format,Z=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||F!==si&&F!==gn&&(ke.getTransfer(F)===qe?(Y!==Vt||Z!==an)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),x}function xe(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(d.width=b.naturalWidth||b.width,d.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(d.width=b.displayWidth,d.height=b.displayHeight):(d.width=b.width,d.height=b.height),d}this.allocateTextureUnit=z,this.resetTextureUnits=H,this.setTexture2D=K,this.setTexture2DArray=W,this.setTexture3D=ee,this.setTextureCube=V,this.rebindTextures=Ae,this.setupRenderTarget=st,this.updateRenderTargetMipmap=et,this.updateMultisampleRenderTarget=Pt,this.setupDepthRenderbuffer=Ve,this.setupFrameBufferTexture=me,this.useMultisampledRTT=Oe}function wf(i,e){function t(n,s=gn){let r;const a=ke.getTransfer(s);if(n===an)return i.UNSIGNED_BYTE;if(n===Nr)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Pr)return i.UNSIGNED_SHORT_5_5_5_1;if(n===qa)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Wa)return i.BYTE;if(n===Xa)return i.SHORT;if(n===gi)return i.UNSIGNED_SHORT;if(n===Rr)return i.INT;if(n===In)return i.UNSIGNED_INT;if(n===nn)return i.FLOAT;if(n===Mi)return i.HALF_FLOAT;if(n===Ya)return i.ALPHA;if(n===$a)return i.RGB;if(n===Vt)return i.RGBA;if(n===_i)return i.DEPTH_COMPONENT;if(n===vi)return i.DEPTH_STENCIL;if(n===Ka)return i.RED;if(n===Dr)return i.RED_INTEGER;if(n===Za)return i.RG;if(n===Lr)return i.RG_INTEGER;if(n===Ur)return i.RGBA_INTEGER;if(n===$i||n===Ki||n===Zi||n===Ji)if(a===qe)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===$i)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Ki)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Zi)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ji)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===$i)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Ki)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Zi)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ji)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===er||n===tr||n===nr||n===ir)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===er)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===tr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===nr)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===ir)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===sr||n===rr||n===ar)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===sr||n===rr)return a===qe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===ar)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===or||n===lr||n===cr||n===dr||n===ur||n===hr||n===fr||n===pr||n===mr||n===gr||n===xr||n===_r||n===vr||n===Mr)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===or)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===lr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===cr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===dr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===ur)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===hr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===fr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===pr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===mr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===gr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===xr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===_r)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===vr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Mr)return a===qe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Qi||n===Sr||n===yr)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Qi)return a===qe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===Sr)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===yr)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Ja||n===Er||n===br||n===Tr)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Qi)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Er)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===br)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Tr)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===xi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const Cf=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Rf=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Nf{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){const s=new Tt,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new Mn({vertexShader:Cf,fragmentShader:Rf,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Rt(new os(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Pf extends ai{constructor(e,t){super();const n=this;let s=null,r=1,a=null,o="local-floor",c=1,d=null,f=null,p=null,h=null,m=null,_=null;const S=new Nf,g=t.getContextAttributes();let u=null,A=null;const T=[],E=[],D=new $e;let C=null;const w=new Ft;w.viewport=new rt;const L=new Ft;L.viewport=new rt;const y=[w,L],M=new Zl;let N=null,H=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(q){let te=T[q];return te===void 0&&(te=new Ls,T[q]=te),te.getTargetRaySpace()},this.getControllerGrip=function(q){let te=T[q];return te===void 0&&(te=new Ls,T[q]=te),te.getGripSpace()},this.getHand=function(q){let te=T[q];return te===void 0&&(te=new Ls,T[q]=te),te.getHandSpace()};function z(q){const te=E.indexOf(q.inputSource);if(te===-1)return;const me=T[te];me!==void 0&&(me.update(q.inputSource,q.frame,d||a),me.dispatchEvent({type:q.type,data:q.inputSource}))}function j(){s.removeEventListener("select",z),s.removeEventListener("selectstart",z),s.removeEventListener("selectend",z),s.removeEventListener("squeeze",z),s.removeEventListener("squeezestart",z),s.removeEventListener("squeezeend",z),s.removeEventListener("end",j),s.removeEventListener("inputsourceschange",K);for(let q=0;q<T.length;q++){const te=E[q];te!==null&&(E[q]=null,T[q].disconnect(te))}N=null,H=null,S.reset(),e.setRenderTarget(u),m=null,h=null,p=null,s=null,A=null,Ke.stop(),n.isPresenting=!1,e.setPixelRatio(C),e.setSize(D.width,D.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){r=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){o=q,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return d||a},this.setReferenceSpace=function(q){d=q},this.getBaseLayer=function(){return h!==null?h:m},this.getBinding=function(){return p},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(q){if(s=q,s!==null){if(u=e.getRenderTarget(),s.addEventListener("select",z),s.addEventListener("selectstart",z),s.addEventListener("selectend",z),s.addEventListener("squeeze",z),s.addEventListener("squeezestart",z),s.addEventListener("squeezeend",z),s.addEventListener("end",j),s.addEventListener("inputsourceschange",K),g.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(D),typeof XRWebGLBinding<"u"&&"createProjectionLayer"in XRWebGLBinding.prototype){let me=null,re=null,ye=null;g.depth&&(ye=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,me=g.stencil?vi:_i,re=g.stencil?xi:In);const Ve={colorFormat:t.RGBA8,depthFormat:ye,scaleFactor:r};p=new XRWebGLBinding(s,t),h=p.createProjectionLayer(Ve),s.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),A=new Fn(h.textureWidth,h.textureHeight,{format:Vt,type:an,depthTexture:new uo(h.textureWidth,h.textureHeight,re,void 0,void 0,void 0,void 0,void 0,void 0,me),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1})}else{const me={antialias:g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};m=new XRWebGLLayer(s,t,me),s.updateRenderState({baseLayer:m}),e.setPixelRatio(1),e.setSize(m.framebufferWidth,m.framebufferHeight,!1),A=new Fn(m.framebufferWidth,m.framebufferHeight,{format:Vt,type:an,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil,resolveDepthBuffer:m.ignoreDepthValues===!1,resolveStencilBuffer:m.ignoreDepthValues===!1})}A.isXRRenderTarget=!0,this.setFoveation(c),d=null,a=await s.requestReferenceSpace(o),Ke.setContext(s),Ke.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return S.getDepthTexture()};function K(q){for(let te=0;te<q.removed.length;te++){const me=q.removed[te],re=E.indexOf(me);re>=0&&(E[re]=null,T[re].disconnect(me))}for(let te=0;te<q.added.length;te++){const me=q.added[te];let re=E.indexOf(me);if(re===-1){for(let Ve=0;Ve<T.length;Ve++)if(Ve>=E.length){E.push(me),re=Ve;break}else if(E[Ve]===null){E[Ve]=me,re=Ve;break}if(re===-1)break}const ye=T[re];ye&&ye.connect(me)}}const W=new O,ee=new O;function V(q,te,me){W.setFromMatrixPosition(te.matrixWorld),ee.setFromMatrixPosition(me.matrixWorld);const re=W.distanceTo(ee),ye=te.projectionMatrix.elements,Ve=me.projectionMatrix.elements,Ae=ye[14]/(ye[10]-1),st=ye[14]/(ye[10]+1),et=(ye[9]+1)/ye[5],Fe=(ye[9]-1)/ye[5],R=(ye[8]-1)/ye[0],Pt=(Ve[8]+1)/Ve[0],ze=Ae*R,Oe=Ae*Pt,ve=re/(-R+Pt),Je=ve*-R;if(te.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(Je),q.translateZ(ve),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert(),ye[10]===-1)q.projectionMatrix.copy(te.projectionMatrix),q.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{const xe=Ae+ve,b=st+ve,x=ze-Je,F=Oe+(re-Je),Y=et*st/b*xe,Z=Fe*st/b*xe;q.projectionMatrix.makePerspective(x,F,Y,Z,xe,b),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}}function se(q,te){te===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(te.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCamera=function(q){if(s===null)return;let te=q.near,me=q.far;S.texture!==null&&(S.depthNear>0&&(te=S.depthNear),S.depthFar>0&&(me=S.depthFar)),M.near=L.near=w.near=te,M.far=L.far=w.far=me,(N!==M.near||H!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),N=M.near,H=M.far),w.layers.mask=q.layers.mask|2,L.layers.mask=q.layers.mask|4,M.layers.mask=w.layers.mask|L.layers.mask;const re=q.parent,ye=M.cameras;se(M,re);for(let Ve=0;Ve<ye.length;Ve++)se(ye[Ve],re);ye.length===2?V(M,w,L):M.projectionMatrix.copy(w.projectionMatrix),ue(q,M,re)};function ue(q,te,me){me===null?q.matrix.copy(te.matrixWorld):(q.matrix.copy(me.matrixWorld),q.matrix.invert(),q.matrix.multiply(te.matrixWorld)),q.matrix.decompose(q.position,q.quaternion,q.scale),q.updateMatrixWorld(!0),q.projectionMatrix.copy(te.projectionMatrix),q.projectionMatrixInverse.copy(te.projectionMatrixInverse),q.isPerspectiveCamera&&(q.fov=Ar*2*Math.atan(1/q.projectionMatrix.elements[5]),q.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(h===null&&m===null))return c},this.setFoveation=function(q){c=q,h!==null&&(h.fixedFoveation=q),m!==null&&m.fixedFoveation!==void 0&&(m.fixedFoveation=q)},this.hasDepthSensing=function(){return S.texture!==null},this.getDepthSensingMesh=function(){return S.getMesh(M)};let _e=null;function Ue(q,te){if(f=te.getViewerPose(d||a),_=te,f!==null){const me=f.views;m!==null&&(e.setRenderTargetFramebuffer(A,m.framebuffer),e.setRenderTarget(A));let re=!1;me.length!==M.cameras.length&&(M.cameras.length=0,re=!0);for(let Ae=0;Ae<me.length;Ae++){const st=me[Ae];let et=null;if(m!==null)et=m.getViewport(st);else{const R=p.getViewSubImage(h,st);et=R.viewport,Ae===0&&(e.setRenderTargetTextures(A,R.colorTexture,R.depthStencilTexture),e.setRenderTarget(A))}let Fe=y[Ae];Fe===void 0&&(Fe=new Ft,Fe.layers.enable(Ae),Fe.viewport=new rt,y[Ae]=Fe),Fe.matrix.fromArray(st.transform.matrix),Fe.matrix.decompose(Fe.position,Fe.quaternion,Fe.scale),Fe.projectionMatrix.fromArray(st.projectionMatrix),Fe.projectionMatrixInverse.copy(Fe.projectionMatrix).invert(),Fe.viewport.set(et.x,et.y,et.width,et.height),Ae===0&&(M.matrix.copy(Fe.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),re===!0&&M.cameras.push(Fe)}const ye=s.enabledFeatures;if(ye&&ye.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&p){const Ae=p.getDepthInformation(me[0]);Ae&&Ae.isValid&&Ae.texture&&S.init(e,Ae,s.renderState)}}for(let me=0;me<T.length;me++){const re=E[me],ye=T[me];re!==null&&ye!==void 0&&ye.update(re,te,d||a)}_e&&_e(q,te),te.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:te}),_=null}const Ke=new ho;Ke.setAnimationLoop(Ue),this.setAnimationLoop=function(q){_e=q},this.dispose=function(){}}}const Cn=new on,Df=new lt;function Lf(i,e){function t(g,u){g.matrixAutoUpdate===!0&&g.updateMatrix(),u.value.copy(g.matrix)}function n(g,u){u.color.getRGB(g.fogColor.value,ao(i)),u.isFog?(g.fogNear.value=u.near,g.fogFar.value=u.far):u.isFogExp2&&(g.fogDensity.value=u.density)}function s(g,u,A,T,E){u.isMeshBasicMaterial||u.isMeshLambertMaterial?r(g,u):u.isMeshToonMaterial?(r(g,u),p(g,u)):u.isMeshPhongMaterial?(r(g,u),f(g,u)):u.isMeshStandardMaterial?(r(g,u),h(g,u),u.isMeshPhysicalMaterial&&m(g,u,E)):u.isMeshMatcapMaterial?(r(g,u),_(g,u)):u.isMeshDepthMaterial?r(g,u):u.isMeshDistanceMaterial?(r(g,u),S(g,u)):u.isMeshNormalMaterial?r(g,u):u.isLineBasicMaterial?(a(g,u),u.isLineDashedMaterial&&o(g,u)):u.isPointsMaterial?c(g,u,A,T):u.isSpriteMaterial?d(g,u):u.isShadowMaterial?(g.color.value.copy(u.color),g.opacity.value=u.opacity):u.isShaderMaterial&&(u.uniformsNeedUpdate=!1)}function r(g,u){g.opacity.value=u.opacity,u.color&&g.diffuse.value.copy(u.color),u.emissive&&g.emissive.value.copy(u.emissive).multiplyScalar(u.emissiveIntensity),u.map&&(g.map.value=u.map,t(u.map,g.mapTransform)),u.alphaMap&&(g.alphaMap.value=u.alphaMap,t(u.alphaMap,g.alphaMapTransform)),u.bumpMap&&(g.bumpMap.value=u.bumpMap,t(u.bumpMap,g.bumpMapTransform),g.bumpScale.value=u.bumpScale,u.side===bt&&(g.bumpScale.value*=-1)),u.normalMap&&(g.normalMap.value=u.normalMap,t(u.normalMap,g.normalMapTransform),g.normalScale.value.copy(u.normalScale),u.side===bt&&g.normalScale.value.negate()),u.displacementMap&&(g.displacementMap.value=u.displacementMap,t(u.displacementMap,g.displacementMapTransform),g.displacementScale.value=u.displacementScale,g.displacementBias.value=u.displacementBias),u.emissiveMap&&(g.emissiveMap.value=u.emissiveMap,t(u.emissiveMap,g.emissiveMapTransform)),u.specularMap&&(g.specularMap.value=u.specularMap,t(u.specularMap,g.specularMapTransform)),u.alphaTest>0&&(g.alphaTest.value=u.alphaTest);const A=e.get(u),T=A.envMap,E=A.envMapRotation;T&&(g.envMap.value=T,Cn.copy(E),Cn.x*=-1,Cn.y*=-1,Cn.z*=-1,T.isCubeTexture&&T.isRenderTargetTexture===!1&&(Cn.y*=-1,Cn.z*=-1),g.envMapRotation.value.setFromMatrix4(Df.makeRotationFromEuler(Cn)),g.flipEnvMap.value=T.isCubeTexture&&T.isRenderTargetTexture===!1?-1:1,g.reflectivity.value=u.reflectivity,g.ior.value=u.ior,g.refractionRatio.value=u.refractionRatio),u.lightMap&&(g.lightMap.value=u.lightMap,g.lightMapIntensity.value=u.lightMapIntensity,t(u.lightMap,g.lightMapTransform)),u.aoMap&&(g.aoMap.value=u.aoMap,g.aoMapIntensity.value=u.aoMapIntensity,t(u.aoMap,g.aoMapTransform))}function a(g,u){g.diffuse.value.copy(u.color),g.opacity.value=u.opacity,u.map&&(g.map.value=u.map,t(u.map,g.mapTransform))}function o(g,u){g.dashSize.value=u.dashSize,g.totalSize.value=u.dashSize+u.gapSize,g.scale.value=u.scale}function c(g,u,A,T){g.diffuse.value.copy(u.color),g.opacity.value=u.opacity,g.size.value=u.size*A,g.scale.value=T*.5,u.map&&(g.map.value=u.map,t(u.map,g.uvTransform)),u.alphaMap&&(g.alphaMap.value=u.alphaMap,t(u.alphaMap,g.alphaMapTransform)),u.alphaTest>0&&(g.alphaTest.value=u.alphaTest)}function d(g,u){g.diffuse.value.copy(u.color),g.opacity.value=u.opacity,g.rotation.value=u.rotation,u.map&&(g.map.value=u.map,t(u.map,g.mapTransform)),u.alphaMap&&(g.alphaMap.value=u.alphaMap,t(u.alphaMap,g.alphaMapTransform)),u.alphaTest>0&&(g.alphaTest.value=u.alphaTest)}function f(g,u){g.specular.value.copy(u.specular),g.shininess.value=Math.max(u.shininess,1e-4)}function p(g,u){u.gradientMap&&(g.gradientMap.value=u.gradientMap)}function h(g,u){g.metalness.value=u.metalness,u.metalnessMap&&(g.metalnessMap.value=u.metalnessMap,t(u.metalnessMap,g.metalnessMapTransform)),g.roughness.value=u.roughness,u.roughnessMap&&(g.roughnessMap.value=u.roughnessMap,t(u.roughnessMap,g.roughnessMapTransform)),u.envMap&&(g.envMapIntensity.value=u.envMapIntensity)}function m(g,u,A){g.ior.value=u.ior,u.sheen>0&&(g.sheenColor.value.copy(u.sheenColor).multiplyScalar(u.sheen),g.sheenRoughness.value=u.sheenRoughness,u.sheenColorMap&&(g.sheenColorMap.value=u.sheenColorMap,t(u.sheenColorMap,g.sheenColorMapTransform)),u.sheenRoughnessMap&&(g.sheenRoughnessMap.value=u.sheenRoughnessMap,t(u.sheenRoughnessMap,g.sheenRoughnessMapTransform))),u.clearcoat>0&&(g.clearcoat.value=u.clearcoat,g.clearcoatRoughness.value=u.clearcoatRoughness,u.clearcoatMap&&(g.clearcoatMap.value=u.clearcoatMap,t(u.clearcoatMap,g.clearcoatMapTransform)),u.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=u.clearcoatRoughnessMap,t(u.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),u.clearcoatNormalMap&&(g.clearcoatNormalMap.value=u.clearcoatNormalMap,t(u.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(u.clearcoatNormalScale),u.side===bt&&g.clearcoatNormalScale.value.negate())),u.dispersion>0&&(g.dispersion.value=u.dispersion),u.iridescence>0&&(g.iridescence.value=u.iridescence,g.iridescenceIOR.value=u.iridescenceIOR,g.iridescenceThicknessMinimum.value=u.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=u.iridescenceThicknessRange[1],u.iridescenceMap&&(g.iridescenceMap.value=u.iridescenceMap,t(u.iridescenceMap,g.iridescenceMapTransform)),u.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=u.iridescenceThicknessMap,t(u.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),u.transmission>0&&(g.transmission.value=u.transmission,g.transmissionSamplerMap.value=A.texture,g.transmissionSamplerSize.value.set(A.width,A.height),u.transmissionMap&&(g.transmissionMap.value=u.transmissionMap,t(u.transmissionMap,g.transmissionMapTransform)),g.thickness.value=u.thickness,u.thicknessMap&&(g.thicknessMap.value=u.thicknessMap,t(u.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=u.attenuationDistance,g.attenuationColor.value.copy(u.attenuationColor)),u.anisotropy>0&&(g.anisotropyVector.value.set(u.anisotropy*Math.cos(u.anisotropyRotation),u.anisotropy*Math.sin(u.anisotropyRotation)),u.anisotropyMap&&(g.anisotropyMap.value=u.anisotropyMap,t(u.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=u.specularIntensity,g.specularColor.value.copy(u.specularColor),u.specularColorMap&&(g.specularColorMap.value=u.specularColorMap,t(u.specularColorMap,g.specularColorMapTransform)),u.specularIntensityMap&&(g.specularIntensityMap.value=u.specularIntensityMap,t(u.specularIntensityMap,g.specularIntensityMapTransform))}function _(g,u){u.matcap&&(g.matcap.value=u.matcap)}function S(g,u){const A=e.get(u).light;g.referencePosition.value.setFromMatrixPosition(A.matrixWorld),g.nearDistance.value=A.shadow.camera.near,g.farDistance.value=A.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function Uf(i,e,t,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(A,T){const E=T.program;n.uniformBlockBinding(A,E)}function d(A,T){let E=s[A.id];E===void 0&&(_(A),E=f(A),s[A.id]=E,A.addEventListener("dispose",g));const D=T.program;n.updateUBOMapping(A,D);const C=e.render.frame;r[A.id]!==C&&(h(A),r[A.id]=C)}function f(A){const T=p();A.__bindingPointIndex=T;const E=i.createBuffer(),D=A.__size,C=A.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,D,C),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,T,E),E}function p(){for(let A=0;A<o;A++)if(a.indexOf(A)===-1)return a.push(A),A;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(A){const T=s[A.id],E=A.uniforms,D=A.__cache;i.bindBuffer(i.UNIFORM_BUFFER,T);for(let C=0,w=E.length;C<w;C++){const L=Array.isArray(E[C])?E[C]:[E[C]];for(let y=0,M=L.length;y<M;y++){const N=L[y];if(m(N,C,y,D)===!0){const H=N.__offset,z=Array.isArray(N.value)?N.value:[N.value];let j=0;for(let K=0;K<z.length;K++){const W=z[K],ee=S(W);typeof W=="number"||typeof W=="boolean"?(N.__data[0]=W,i.bufferSubData(i.UNIFORM_BUFFER,H+j,N.__data)):W.isMatrix3?(N.__data[0]=W.elements[0],N.__data[1]=W.elements[1],N.__data[2]=W.elements[2],N.__data[3]=0,N.__data[4]=W.elements[3],N.__data[5]=W.elements[4],N.__data[6]=W.elements[5],N.__data[7]=0,N.__data[8]=W.elements[6],N.__data[9]=W.elements[7],N.__data[10]=W.elements[8],N.__data[11]=0):(W.toArray(N.__data,j),j+=ee.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,H,N.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function m(A,T,E,D){const C=A.value,w=T+"_"+E;if(D[w]===void 0)return typeof C=="number"||typeof C=="boolean"?D[w]=C:D[w]=C.clone(),!0;{const L=D[w];if(typeof C=="number"||typeof C=="boolean"){if(L!==C)return D[w]=C,!0}else if(L.equals(C)===!1)return L.copy(C),!0}return!1}function _(A){const T=A.uniforms;let E=0;const D=16;for(let w=0,L=T.length;w<L;w++){const y=Array.isArray(T[w])?T[w]:[T[w]];for(let M=0,N=y.length;M<N;M++){const H=y[M],z=Array.isArray(H.value)?H.value:[H.value];for(let j=0,K=z.length;j<K;j++){const W=z[j],ee=S(W),V=E%D,se=V%ee.boundary,ue=V+se;E+=se,ue!==0&&D-ue<ee.storage&&(E+=D-ue),H.__data=new Float32Array(ee.storage/Float32Array.BYTES_PER_ELEMENT),H.__offset=E,E+=ee.storage}}}const C=E%D;return C>0&&(E+=D-C),A.__size=E,A.__cache={},this}function S(A){const T={boundary:0,storage:0};return typeof A=="number"||typeof A=="boolean"?(T.boundary=4,T.storage=4):A.isVector2?(T.boundary=8,T.storage=8):A.isVector3||A.isColor?(T.boundary=16,T.storage=12):A.isVector4?(T.boundary=16,T.storage=16):A.isMatrix3?(T.boundary=48,T.storage=48):A.isMatrix4?(T.boundary=64,T.storage=64):A.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",A),T}function g(A){const T=A.target;T.removeEventListener("dispose",g);const E=a.indexOf(T.__bindingPointIndex);a.splice(E,1),i.deleteBuffer(s[T.id]),delete s[T.id],delete r[T.id]}function u(){for(const A in s)i.deleteBuffer(s[A]);a=[],s={},r={}}return{bind:c,update:d,dispose:u}}class If{constructor(e={}){const{canvas:t=gl(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:d=!1,powerPreference:f="default",failIfMajorPerformanceCaveat:p=!1,reverseDepthBuffer:h=!1}=e;this.isWebGLRenderer=!0;let m;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=n.getContextAttributes().alpha}else m=a;const _=new Uint32Array(4),S=new Int32Array(4);let g=null,u=null;const A=[],T=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=_n,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const E=this;let D=!1;this._outputColorSpace=It;let C=0,w=0,L=null,y=-1,M=null;const N=new rt,H=new rt;let z=null;const j=new Ye(0);let K=0,W=t.width,ee=t.height,V=1,se=null,ue=null;const _e=new rt(0,0,W,ee),Ue=new rt(0,0,W,ee);let Ke=!1;const q=new co;let te=!1,me=!1;const re=new lt,ye=new lt,Ve=new O,Ae=new rt,st={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let et=!1;function Fe(){return L===null?V:1}let R=n;function Pt(v,U){return t.getContext(v,U)}try{const v={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:d,powerPreference:f,failIfMajorPerformanceCaveat:p};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Cr}`),t.addEventListener("webglcontextlost",$,!1),t.addEventListener("webglcontextrestored",ce,!1),t.addEventListener("webglcontextcreationerror",le,!1),R===null){const U="webgl2";if(R=Pt(U,v),R===null)throw Pt(U)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(v){throw console.error("THREE.WebGLRenderer: "+v.message),v}let ze,Oe,ve,Je,xe,b,x,F,Y,Z,X,ge,ae,Ee,be,J,he,Te,Ce,fe,Be,De,Ze,P;function oe(){ze=new ju(R),ze.init(),De=new wf(R,ze),Oe=new Ou(R,ze,e,De),ve=new Tf(R,ze),Oe.reverseDepthBuffer&&h&&ve.buffers.depth.setReversed(!0),Je=new qu(R),xe=new hf,b=new Af(R,ze,ve,xe,Oe,De,Je),x=new zu(E),F=new Vu(E),Y=new Ql(R),Ze=new Iu(R,Y),Z=new Wu(R,Y,Je,Ze),X=new $u(R,Z,Y,Je),Ce=new Yu(R,Oe,b),J=new Bu(xe),ge=new uf(E,x,F,ze,Oe,Ze,J),ae=new Lf(E,xe),Ee=new pf,be=new Mf(ze),Te=new Uu(E,x,F,ve,X,m,c),he=new Ef(E,X,Oe),P=new Uf(R,Je,Oe,ve),fe=new Fu(R,ze,Je),Be=new Xu(R,ze,Je),Je.programs=ge.programs,E.capabilities=Oe,E.extensions=ze,E.properties=xe,E.renderLists=Ee,E.shadowMap=he,E.state=ve,E.info=Je}oe();const k=new Pf(E,R);this.xr=k,this.getContext=function(){return R},this.getContextAttributes=function(){return R.getContextAttributes()},this.forceContextLoss=function(){const v=ze.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){const v=ze.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return V},this.setPixelRatio=function(v){v!==void 0&&(V=v,this.setSize(W,ee,!1))},this.getSize=function(v){return v.set(W,ee)},this.setSize=function(v,U,B=!0){if(k.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}W=v,ee=U,t.width=Math.floor(v*V),t.height=Math.floor(U*V),B===!0&&(t.style.width=v+"px",t.style.height=U+"px"),this.setViewport(0,0,v,U)},this.getDrawingBufferSize=function(v){return v.set(W*V,ee*V).floor()},this.setDrawingBufferSize=function(v,U,B){W=v,ee=U,V=B,t.width=Math.floor(v*B),t.height=Math.floor(U*B),this.setViewport(0,0,v,U)},this.getCurrentViewport=function(v){return v.copy(N)},this.getViewport=function(v){return v.copy(_e)},this.setViewport=function(v,U,B,G){v.isVector4?_e.set(v.x,v.y,v.z,v.w):_e.set(v,U,B,G),ve.viewport(N.copy(_e).multiplyScalar(V).round())},this.getScissor=function(v){return v.copy(Ue)},this.setScissor=function(v,U,B,G){v.isVector4?Ue.set(v.x,v.y,v.z,v.w):Ue.set(v,U,B,G),ve.scissor(H.copy(Ue).multiplyScalar(V).round())},this.getScissorTest=function(){return Ke},this.setScissorTest=function(v){ve.setScissorTest(Ke=v)},this.setOpaqueSort=function(v){se=v},this.setTransparentSort=function(v){ue=v},this.getClearColor=function(v){return v.copy(Te.getClearColor())},this.setClearColor=function(){Te.setClearColor(...arguments)},this.getClearAlpha=function(){return Te.getClearAlpha()},this.setClearAlpha=function(){Te.setClearAlpha(...arguments)},this.clear=function(v=!0,U=!0,B=!0){let G=0;if(v){let I=!1;if(L!==null){const Q=L.texture.format;I=Q===Ur||Q===Lr||Q===Dr}if(I){const Q=L.texture.type,ie=Q===an||Q===In||Q===gi||Q===xi||Q===Nr||Q===Pr,de=Te.getClearColor(),pe=Te.getClearAlpha(),Re=de.r,we=de.g,Me=de.b;ie?(_[0]=Re,_[1]=we,_[2]=Me,_[3]=pe,R.clearBufferuiv(R.COLOR,0,_)):(S[0]=Re,S[1]=we,S[2]=Me,S[3]=pe,R.clearBufferiv(R.COLOR,0,S))}else G|=R.COLOR_BUFFER_BIT}U&&(G|=R.DEPTH_BUFFER_BIT),B&&(G|=R.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),R.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",$,!1),t.removeEventListener("webglcontextrestored",ce,!1),t.removeEventListener("webglcontextcreationerror",le,!1),Te.dispose(),Ee.dispose(),be.dispose(),xe.dispose(),x.dispose(),F.dispose(),X.dispose(),Ze.dispose(),P.dispose(),ge.dispose(),k.dispose(),k.removeEventListener("sessionstart",Gr),k.removeEventListener("sessionend",Hr),Sn.stop()};function $(v){v.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),D=!0}function ce(){console.log("THREE.WebGLRenderer: Context Restored."),D=!1;const v=Je.autoReset,U=he.enabled,B=he.autoUpdate,G=he.needsUpdate,I=he.type;oe(),Je.autoReset=v,he.enabled=U,he.autoUpdate=B,he.needsUpdate=G,he.type=I}function le(v){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function Ne(v){const U=v.target;U.removeEventListener("dispose",Ne),tt(U)}function tt(v){mt(v),xe.remove(v)}function mt(v){const U=xe.get(v).programs;U!==void 0&&(U.forEach(function(B){ge.releaseProgram(B)}),v.isShaderMaterial&&ge.releaseShaderCache(v))}this.renderBufferDirect=function(v,U,B,G,I,Q){U===null&&(U=st);const ie=I.isMesh&&I.matrixWorld.determinant()<0,de=xo(v,U,B,G,I);ve.setMaterial(G,ie);let pe=B.index,Re=1;if(G.wireframe===!0){if(pe=Z.getWireframeAttribute(B),pe===void 0)return;Re=2}const we=B.drawRange,Me=B.attributes.position;let Ge=we.start*Re,je=(we.start+we.count)*Re;Q!==null&&(Ge=Math.max(Ge,Q.start*Re),je=Math.min(je,(Q.start+Q.count)*Re)),pe!==null?(Ge=Math.max(Ge,0),je=Math.min(je,pe.count)):Me!=null&&(Ge=Math.max(Ge,0),je=Math.min(je,Me.count));const at=je-Ge;if(at<0||at===1/0)return;Ze.setup(I,G,de,B,pe);let nt,He=fe;if(pe!==null&&(nt=Y.get(pe),He=Be,He.setIndex(nt)),I.isMesh)G.wireframe===!0?(ve.setLineWidth(G.wireframeLinewidth*Fe()),He.setMode(R.LINES)):He.setMode(R.TRIANGLES);else if(I.isLine){let Se=G.linewidth;Se===void 0&&(Se=1),ve.setLineWidth(Se*Fe()),I.isLineSegments?He.setMode(R.LINES):I.isLineLoop?He.setMode(R.LINE_LOOP):He.setMode(R.LINE_STRIP)}else I.isPoints?He.setMode(R.POINTS):I.isSprite&&He.setMode(R.TRIANGLES);if(I.isBatchedMesh)if(I._multiDrawInstances!==null)es("THREE.WebGLRenderer: renderMultiDrawInstances has been deprecated and will be removed in r184. Append to renderMultiDraw arguments and use indirection."),He.renderMultiDrawInstances(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount,I._multiDrawInstances);else if(ze.get("WEBGL_multi_draw"))He.renderMultiDraw(I._multiDrawStarts,I._multiDrawCounts,I._multiDrawCount);else{const Se=I._multiDrawStarts,ft=I._multiDrawCounts,We=I._multiDrawCount,Bt=pe?Y.get(pe).bytesPerElement:1,On=xe.get(G).currentProgram.getUniforms();for(let At=0;At<We;At++)On.setValue(R,"_gl_DrawID",At),He.render(Se[At]/Bt,ft[At])}else if(I.isInstancedMesh)He.renderInstances(Ge,at,I.count);else if(B.isInstancedBufferGeometry){const Se=B._maxInstanceCount!==void 0?B._maxInstanceCount:1/0,ft=Math.min(B.instanceCount,Se);He.renderInstances(Ge,at,ft)}else He.render(Ge,at)};function Xe(v,U,B){v.transparent===!0&&v.side===tn&&v.forceSinglePass===!1?(v.side=bt,v.needsUpdate=!0,Ai(v,U,B),v.side=vn,v.needsUpdate=!0,Ai(v,U,B),v.side=tn):Ai(v,U,B)}this.compile=function(v,U,B=null){B===null&&(B=v),u=be.get(B),u.init(U),T.push(u),B.traverseVisible(function(I){I.isLight&&I.layers.test(U.layers)&&(u.pushLight(I),I.castShadow&&u.pushShadow(I))}),v!==B&&v.traverseVisible(function(I){I.isLight&&I.layers.test(U.layers)&&(u.pushLight(I),I.castShadow&&u.pushShadow(I))}),u.setupLights();const G=new Set;return v.traverse(function(I){if(!(I.isMesh||I.isPoints||I.isLine||I.isSprite))return;const Q=I.material;if(Q)if(Array.isArray(Q))for(let ie=0;ie<Q.length;ie++){const de=Q[ie];Xe(de,B,I),G.add(de)}else Xe(Q,B,I),G.add(Q)}),u=T.pop(),G},this.compileAsync=function(v,U,B=null){const G=this.compile(v,U,B);return new Promise(I=>{function Q(){if(G.forEach(function(ie){xe.get(ie).currentProgram.isReady()&&G.delete(ie)}),G.size===0){I(v);return}setTimeout(Q,10)}ze.get("KHR_parallel_shader_compile")!==null?Q():setTimeout(Q,10)})};let Ot=null;function Yt(v){Ot&&Ot(v)}function Gr(){Sn.stop()}function Hr(){Sn.start()}const Sn=new ho;Sn.setAnimationLoop(Yt),typeof self<"u"&&Sn.setContext(self),this.setAnimationLoop=function(v){Ot=v,k.setAnimationLoop(v),v===null?Sn.stop():Sn.start()},k.addEventListener("sessionstart",Gr),k.addEventListener("sessionend",Hr),this.render=function(v,U){if(U!==void 0&&U.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),k.enabled===!0&&k.isPresenting===!0&&(k.cameraAutoUpdate===!0&&k.updateCamera(U),U=k.getCamera()),v.isScene===!0&&v.onBeforeRender(E,v,U,L),u=be.get(v,T.length),u.init(U),T.push(u),ye.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),q.setFromProjectionMatrix(ye),me=this.localClippingEnabled,te=J.init(this.clippingPlanes,me),g=Ee.get(v,A.length),g.init(),A.push(g),k.enabled===!0&&k.isPresenting===!0){const Q=E.xr.getDepthSensingMesh();Q!==null&&cs(Q,U,-1/0,E.sortObjects)}cs(v,U,0,E.sortObjects),g.finish(),E.sortObjects===!0&&g.sort(se,ue),et=k.enabled===!1||k.isPresenting===!1||k.hasDepthSensing()===!1,et&&Te.addToRenderList(g,v),this.info.render.frame++,te===!0&&J.beginShadows();const B=u.state.shadowsArray;he.render(B,v,U),te===!0&&J.endShadows(),this.info.autoReset===!0&&this.info.reset();const G=g.opaque,I=g.transmissive;if(u.setupLights(),U.isArrayCamera){const Q=U.cameras;if(I.length>0)for(let ie=0,de=Q.length;ie<de;ie++){const pe=Q[ie];Vr(G,I,v,pe)}et&&Te.render(v);for(let ie=0,de=Q.length;ie<de;ie++){const pe=Q[ie];kr(g,v,pe,pe.viewport)}}else I.length>0&&Vr(G,I,v,U),et&&Te.render(v),kr(g,v,U);L!==null&&w===0&&(b.updateMultisampleRenderTarget(L),b.updateRenderTargetMipmap(L)),v.isScene===!0&&v.onAfterRender(E,v,U),Ze.resetDefaultState(),y=-1,M=null,T.pop(),T.length>0?(u=T[T.length-1],te===!0&&J.setGlobalState(E.clippingPlanes,u.state.camera)):u=null,A.pop(),A.length>0?g=A[A.length-1]:g=null};function cs(v,U,B,G){if(v.visible===!1)return;if(v.layers.test(U.layers)){if(v.isGroup)B=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(U);else if(v.isLight)u.pushLight(v),v.castShadow&&u.pushShadow(v);else if(v.isSprite){if(!v.frustumCulled||q.intersectsSprite(v)){G&&Ae.setFromMatrixPosition(v.matrixWorld).applyMatrix4(ye);const ie=X.update(v),de=v.material;de.visible&&g.push(v,ie,de,B,Ae.z,null)}}else if((v.isMesh||v.isLine||v.isPoints)&&(!v.frustumCulled||q.intersectsObject(v))){const ie=X.update(v),de=v.material;if(G&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),Ae.copy(v.boundingSphere.center)):(ie.boundingSphere===null&&ie.computeBoundingSphere(),Ae.copy(ie.boundingSphere.center)),Ae.applyMatrix4(v.matrixWorld).applyMatrix4(ye)),Array.isArray(de)){const pe=ie.groups;for(let Re=0,we=pe.length;Re<we;Re++){const Me=pe[Re],Ge=de[Me.materialIndex];Ge&&Ge.visible&&g.push(v,ie,Ge,B,Ae.z,Me)}}else de.visible&&g.push(v,ie,de,B,Ae.z,null)}}const Q=v.children;for(let ie=0,de=Q.length;ie<de;ie++)cs(Q[ie],U,B,G)}function kr(v,U,B,G){const I=v.opaque,Q=v.transmissive,ie=v.transparent;u.setupLightsView(B),te===!0&&J.setGlobalState(E.clippingPlanes,B),G&&ve.viewport(N.copy(G)),I.length>0&&Ti(I,U,B),Q.length>0&&Ti(Q,U,B),ie.length>0&&Ti(ie,U,B),ve.buffers.depth.setTest(!0),ve.buffers.depth.setMask(!0),ve.buffers.color.setMask(!0),ve.setPolygonOffset(!1)}function Vr(v,U,B,G){if((B.isScene===!0?B.overrideMaterial:null)!==null)return;u.state.transmissionRenderTarget[G.id]===void 0&&(u.state.transmissionRenderTarget[G.id]=new Fn(1,1,{generateMipmaps:!0,type:ze.has("EXT_color_buffer_half_float")||ze.has("EXT_color_buffer_float")?Mi:an,minFilter:Un,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:ke.workingColorSpace}));const Q=u.state.transmissionRenderTarget[G.id],ie=G.viewport||N;Q.setSize(ie.z*E.transmissionResolutionScale,ie.w*E.transmissionResolutionScale);const de=E.getRenderTarget();E.setRenderTarget(Q),E.getClearColor(j),K=E.getClearAlpha(),K<1&&E.setClearColor(16777215,.5),E.clear(),et&&Te.render(B);const pe=E.toneMapping;E.toneMapping=_n;const Re=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),u.setupLightsView(G),te===!0&&J.setGlobalState(E.clippingPlanes,G),Ti(v,B,G),b.updateMultisampleRenderTarget(Q),b.updateRenderTargetMipmap(Q),ze.has("WEBGL_multisampled_render_to_texture")===!1){let we=!1;for(let Me=0,Ge=U.length;Me<Ge;Me++){const je=U[Me],at=je.object,nt=je.geometry,He=je.material,Se=je.group;if(He.side===tn&&at.layers.test(G.layers)){const ft=He.side;He.side=bt,He.needsUpdate=!0,jr(at,B,G,nt,He,Se),He.side=ft,He.needsUpdate=!0,we=!0}}we===!0&&(b.updateMultisampleRenderTarget(Q),b.updateRenderTargetMipmap(Q))}E.setRenderTarget(de),E.setClearColor(j,K),Re!==void 0&&(G.viewport=Re),E.toneMapping=pe}function Ti(v,U,B){const G=U.isScene===!0?U.overrideMaterial:null;for(let I=0,Q=v.length;I<Q;I++){const ie=v[I],de=ie.object,pe=ie.geometry,Re=ie.group;let we=ie.material;we.allowOverride===!0&&G!==null&&(we=G),de.layers.test(B.layers)&&jr(de,U,B,pe,we,Re)}}function jr(v,U,B,G,I,Q){v.onBeforeRender(E,U,B,G,I,Q),v.modelViewMatrix.multiplyMatrices(B.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),I.onBeforeRender(E,U,B,G,v,Q),I.transparent===!0&&I.side===tn&&I.forceSinglePass===!1?(I.side=bt,I.needsUpdate=!0,E.renderBufferDirect(B,U,G,I,v,Q),I.side=vn,I.needsUpdate=!0,E.renderBufferDirect(B,U,G,I,v,Q),I.side=tn):E.renderBufferDirect(B,U,G,I,v,Q),v.onAfterRender(E,U,B,G,I,Q)}function Ai(v,U,B){U.isScene!==!0&&(U=st);const G=xe.get(v),I=u.state.lights,Q=u.state.shadowsArray,ie=I.state.version,de=ge.getParameters(v,I.state,Q,U,B),pe=ge.getProgramCacheKey(de);let Re=G.programs;G.environment=v.isMeshStandardMaterial?U.environment:null,G.fog=U.fog,G.envMap=(v.isMeshStandardMaterial?F:x).get(v.envMap||G.environment),G.envMapRotation=G.environment!==null&&v.envMap===null?U.environmentRotation:v.envMapRotation,Re===void 0&&(v.addEventListener("dispose",Ne),Re=new Map,G.programs=Re);let we=Re.get(pe);if(we!==void 0){if(G.currentProgram===we&&G.lightsStateVersion===ie)return Xr(v,de),we}else de.uniforms=ge.getUniforms(v),v.onBeforeCompile(de,E),we=ge.acquireProgram(de,pe),Re.set(pe,we),G.uniforms=de.uniforms;const Me=G.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(Me.clippingPlanes=J.uniform),Xr(v,de),G.needsLights=vo(v),G.lightsStateVersion=ie,G.needsLights&&(Me.ambientLightColor.value=I.state.ambient,Me.lightProbe.value=I.state.probe,Me.directionalLights.value=I.state.directional,Me.directionalLightShadows.value=I.state.directionalShadow,Me.spotLights.value=I.state.spot,Me.spotLightShadows.value=I.state.spotShadow,Me.rectAreaLights.value=I.state.rectArea,Me.ltc_1.value=I.state.rectAreaLTC1,Me.ltc_2.value=I.state.rectAreaLTC2,Me.pointLights.value=I.state.point,Me.pointLightShadows.value=I.state.pointShadow,Me.hemisphereLights.value=I.state.hemi,Me.directionalShadowMap.value=I.state.directionalShadowMap,Me.directionalShadowMatrix.value=I.state.directionalShadowMatrix,Me.spotShadowMap.value=I.state.spotShadowMap,Me.spotLightMatrix.value=I.state.spotLightMatrix,Me.spotLightMap.value=I.state.spotLightMap,Me.pointShadowMap.value=I.state.pointShadowMap,Me.pointShadowMatrix.value=I.state.pointShadowMatrix),G.currentProgram=we,G.uniformsList=null,we}function Wr(v){if(v.uniformsList===null){const U=v.currentProgram.getUniforms();v.uniformsList=ts.seqWithValue(U.seq,v.uniforms)}return v.uniformsList}function Xr(v,U){const B=xe.get(v);B.outputColorSpace=U.outputColorSpace,B.batching=U.batching,B.batchingColor=U.batchingColor,B.instancing=U.instancing,B.instancingColor=U.instancingColor,B.instancingMorph=U.instancingMorph,B.skinning=U.skinning,B.morphTargets=U.morphTargets,B.morphNormals=U.morphNormals,B.morphColors=U.morphColors,B.morphTargetsCount=U.morphTargetsCount,B.numClippingPlanes=U.numClippingPlanes,B.numIntersection=U.numClipIntersection,B.vertexAlphas=U.vertexAlphas,B.vertexTangents=U.vertexTangents,B.toneMapping=U.toneMapping}function xo(v,U,B,G,I){U.isScene!==!0&&(U=st),b.resetTextureUnits();const Q=U.fog,ie=G.isMeshStandardMaterial?U.environment:null,de=L===null?E.outputColorSpace:L.isXRRenderTarget===!0?L.texture.colorSpace:si,pe=(G.isMeshStandardMaterial?F:x).get(G.envMap||ie),Re=G.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,we=!!B.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Me=!!B.morphAttributes.position,Ge=!!B.morphAttributes.normal,je=!!B.morphAttributes.color;let at=_n;G.toneMapped&&(L===null||L.isXRRenderTarget===!0)&&(at=E.toneMapping);const nt=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,He=nt!==void 0?nt.length:0,Se=xe.get(G),ft=u.state.lights;if(te===!0&&(me===!0||v!==M)){const vt=v===M&&G.id===y;J.setState(G,v,vt)}let We=!1;G.version===Se.__version?(Se.needsLights&&Se.lightsStateVersion!==ft.state.version||Se.outputColorSpace!==de||I.isBatchedMesh&&Se.batching===!1||!I.isBatchedMesh&&Se.batching===!0||I.isBatchedMesh&&Se.batchingColor===!0&&I.colorTexture===null||I.isBatchedMesh&&Se.batchingColor===!1&&I.colorTexture!==null||I.isInstancedMesh&&Se.instancing===!1||!I.isInstancedMesh&&Se.instancing===!0||I.isSkinnedMesh&&Se.skinning===!1||!I.isSkinnedMesh&&Se.skinning===!0||I.isInstancedMesh&&Se.instancingColor===!0&&I.instanceColor===null||I.isInstancedMesh&&Se.instancingColor===!1&&I.instanceColor!==null||I.isInstancedMesh&&Se.instancingMorph===!0&&I.morphTexture===null||I.isInstancedMesh&&Se.instancingMorph===!1&&I.morphTexture!==null||Se.envMap!==pe||G.fog===!0&&Se.fog!==Q||Se.numClippingPlanes!==void 0&&(Se.numClippingPlanes!==J.numPlanes||Se.numIntersection!==J.numIntersection)||Se.vertexAlphas!==Re||Se.vertexTangents!==we||Se.morphTargets!==Me||Se.morphNormals!==Ge||Se.morphColors!==je||Se.toneMapping!==at||Se.morphTargetsCount!==He)&&(We=!0):(We=!0,Se.__version=G.version);let Bt=Se.currentProgram;We===!0&&(Bt=Ai(G,U,I));let On=!1,At=!1,li=!1;const Qe=Bt.getUniforms(),Dt=Se.uniforms;if(ve.useProgram(Bt.program)&&(On=!0,At=!0,li=!0),G.id!==y&&(y=G.id,At=!0),On||M!==v){ve.buffers.depth.getReversed()?(re.copy(v.projectionMatrix),_l(re),vl(re),Qe.setValue(R,"projectionMatrix",re)):Qe.setValue(R,"projectionMatrix",v.projectionMatrix),Qe.setValue(R,"viewMatrix",v.matrixWorldInverse);const St=Qe.map.cameraPosition;St!==void 0&&St.setValue(R,Ve.setFromMatrixPosition(v.matrixWorld)),Oe.logarithmicDepthBuffer&&Qe.setValue(R,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&Qe.setValue(R,"isOrthographic",v.isOrthographicCamera===!0),M!==v&&(M=v,At=!0,li=!0)}if(I.isSkinnedMesh){Qe.setOptional(R,I,"bindMatrix"),Qe.setOptional(R,I,"bindMatrixInverse");const vt=I.skeleton;vt&&(vt.boneTexture===null&&vt.computeBoneTexture(),Qe.setValue(R,"boneTexture",vt.boneTexture,b))}I.isBatchedMesh&&(Qe.setOptional(R,I,"batchingTexture"),Qe.setValue(R,"batchingTexture",I._matricesTexture,b),Qe.setOptional(R,I,"batchingIdTexture"),Qe.setValue(R,"batchingIdTexture",I._indirectTexture,b),Qe.setOptional(R,I,"batchingColorTexture"),I._colorsTexture!==null&&Qe.setValue(R,"batchingColorTexture",I._colorsTexture,b));const Lt=B.morphAttributes;if((Lt.position!==void 0||Lt.normal!==void 0||Lt.color!==void 0)&&Ce.update(I,B,Bt),(At||Se.receiveShadow!==I.receiveShadow)&&(Se.receiveShadow=I.receiveShadow,Qe.setValue(R,"receiveShadow",I.receiveShadow)),G.isMeshGouraudMaterial&&G.envMap!==null&&(Dt.envMap.value=pe,Dt.flipEnvMap.value=pe.isCubeTexture&&pe.isRenderTargetTexture===!1?-1:1),G.isMeshStandardMaterial&&G.envMap===null&&U.environment!==null&&(Dt.envMapIntensity.value=U.environmentIntensity),At&&(Qe.setValue(R,"toneMappingExposure",E.toneMappingExposure),Se.needsLights&&_o(Dt,li),Q&&G.fog===!0&&ae.refreshFogUniforms(Dt,Q),ae.refreshMaterialUniforms(Dt,G,V,ee,u.state.transmissionRenderTarget[v.id]),ts.upload(R,Wr(Se),Dt,b)),G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(ts.upload(R,Wr(Se),Dt,b),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&Qe.setValue(R,"center",I.center),Qe.setValue(R,"modelViewMatrix",I.modelViewMatrix),Qe.setValue(R,"normalMatrix",I.normalMatrix),Qe.setValue(R,"modelMatrix",I.matrixWorld),G.isShaderMaterial||G.isRawShaderMaterial){const vt=G.uniformsGroups;for(let St=0,ds=vt.length;St<ds;St++){const yn=vt[St];P.update(yn,Bt),P.bind(yn,Bt)}}return Bt}function _o(v,U){v.ambientLightColor.needsUpdate=U,v.lightProbe.needsUpdate=U,v.directionalLights.needsUpdate=U,v.directionalLightShadows.needsUpdate=U,v.pointLights.needsUpdate=U,v.pointLightShadows.needsUpdate=U,v.spotLights.needsUpdate=U,v.spotLightShadows.needsUpdate=U,v.rectAreaLights.needsUpdate=U,v.hemisphereLights.needsUpdate=U}function vo(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return w},this.getRenderTarget=function(){return L},this.setRenderTargetTextures=function(v,U,B){const G=xe.get(v);G.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),xe.get(v.texture).__webglTexture=U,xe.get(v.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:B,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,U){const B=xe.get(v);B.__webglFramebuffer=U,B.__useDefaultFramebuffer=U===void 0};const Mo=R.createFramebuffer();this.setRenderTarget=function(v,U=0,B=0){L=v,C=U,w=B;let G=!0,I=null,Q=!1,ie=!1;if(v){const pe=xe.get(v);if(pe.__useDefaultFramebuffer!==void 0)ve.bindFramebuffer(R.FRAMEBUFFER,null),G=!1;else if(pe.__webglFramebuffer===void 0)b.setupRenderTarget(v);else if(pe.__hasExternalTextures)b.rebindTextures(v,xe.get(v.texture).__webglTexture,xe.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){const Me=v.depthTexture;if(pe.__boundDepthTexture!==Me){if(Me!==null&&xe.has(Me)&&(v.width!==Me.image.width||v.height!==Me.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");b.setupDepthRenderbuffer(v)}}const Re=v.texture;(Re.isData3DTexture||Re.isDataArrayTexture||Re.isCompressedArrayTexture)&&(ie=!0);const we=xe.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(we[U])?I=we[U][B]:I=we[U],Q=!0):v.samples>0&&b.useMultisampledRTT(v)===!1?I=xe.get(v).__webglMultisampledFramebuffer:Array.isArray(we)?I=we[B]:I=we,N.copy(v.viewport),H.copy(v.scissor),z=v.scissorTest}else N.copy(_e).multiplyScalar(V).floor(),H.copy(Ue).multiplyScalar(V).floor(),z=Ke;if(B!==0&&(I=Mo),ve.bindFramebuffer(R.FRAMEBUFFER,I)&&G&&ve.drawBuffers(v,I),ve.viewport(N),ve.scissor(H),ve.setScissorTest(z),Q){const pe=xe.get(v.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_CUBE_MAP_POSITIVE_X+U,pe.__webglTexture,B)}else if(ie){const pe=xe.get(v.texture),Re=U;R.framebufferTextureLayer(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,pe.__webglTexture,B,Re)}else if(v!==null&&B!==0){const pe=xe.get(v.texture);R.framebufferTexture2D(R.FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,pe.__webglTexture,B)}y=-1},this.readRenderTargetPixels=function(v,U,B,G,I,Q,ie){if(!(v&&v.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let de=xe.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ie!==void 0&&(de=de[ie]),de){ve.bindFramebuffer(R.FRAMEBUFFER,de);try{const pe=v.texture,Re=pe.format,we=pe.type;if(!Oe.textureFormatReadable(Re)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!Oe.textureTypeReadable(we)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=v.width-G&&B>=0&&B<=v.height-I&&R.readPixels(U,B,G,I,De.convert(Re),De.convert(we),Q)}finally{const pe=L!==null?xe.get(L).__webglFramebuffer:null;ve.bindFramebuffer(R.FRAMEBUFFER,pe)}}},this.readRenderTargetPixelsAsync=async function(v,U,B,G,I,Q,ie){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let de=xe.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&ie!==void 0&&(de=de[ie]),de)if(U>=0&&U<=v.width-G&&B>=0&&B<=v.height-I){ve.bindFramebuffer(R.FRAMEBUFFER,de);const pe=v.texture,Re=pe.format,we=pe.type;if(!Oe.textureFormatReadable(Re))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!Oe.textureTypeReadable(we))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const Me=R.createBuffer();R.bindBuffer(R.PIXEL_PACK_BUFFER,Me),R.bufferData(R.PIXEL_PACK_BUFFER,Q.byteLength,R.STREAM_READ),R.readPixels(U,B,G,I,De.convert(Re),De.convert(we),0);const Ge=L!==null?xe.get(L).__webglFramebuffer:null;ve.bindFramebuffer(R.FRAMEBUFFER,Ge);const je=R.fenceSync(R.SYNC_GPU_COMMANDS_COMPLETE,0);return R.flush(),await xl(R,je,4),R.bindBuffer(R.PIXEL_PACK_BUFFER,Me),R.getBufferSubData(R.PIXEL_PACK_BUFFER,0,Q),R.deleteBuffer(Me),R.deleteSync(je),Q}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,U=null,B=0){const G=Math.pow(2,-B),I=Math.floor(v.image.width*G),Q=Math.floor(v.image.height*G),ie=U!==null?U.x:0,de=U!==null?U.y:0;b.setTexture2D(v,0),R.copyTexSubImage2D(R.TEXTURE_2D,B,0,0,ie,de,I,Q),ve.unbindTexture()};const So=R.createFramebuffer(),yo=R.createFramebuffer();this.copyTextureToTexture=function(v,U,B=null,G=null,I=0,Q=null){Q===null&&(I!==0?(es("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),Q=I,I=0):Q=0);let ie,de,pe,Re,we,Me,Ge,je,at;const nt=v.isCompressedTexture?v.mipmaps[Q]:v.image;if(B!==null)ie=B.max.x-B.min.x,de=B.max.y-B.min.y,pe=B.isBox3?B.max.z-B.min.z:1,Re=B.min.x,we=B.min.y,Me=B.isBox3?B.min.z:0;else{const Lt=Math.pow(2,-I);ie=Math.floor(nt.width*Lt),de=Math.floor(nt.height*Lt),v.isDataArrayTexture?pe=nt.depth:v.isData3DTexture?pe=Math.floor(nt.depth*Lt):pe=1,Re=0,we=0,Me=0}G!==null?(Ge=G.x,je=G.y,at=G.z):(Ge=0,je=0,at=0);const He=De.convert(U.format),Se=De.convert(U.type);let ft;U.isData3DTexture?(b.setTexture3D(U,0),ft=R.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?(b.setTexture2DArray(U,0),ft=R.TEXTURE_2D_ARRAY):(b.setTexture2D(U,0),ft=R.TEXTURE_2D),R.pixelStorei(R.UNPACK_FLIP_Y_WEBGL,U.flipY),R.pixelStorei(R.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),R.pixelStorei(R.UNPACK_ALIGNMENT,U.unpackAlignment);const We=R.getParameter(R.UNPACK_ROW_LENGTH),Bt=R.getParameter(R.UNPACK_IMAGE_HEIGHT),On=R.getParameter(R.UNPACK_SKIP_PIXELS),At=R.getParameter(R.UNPACK_SKIP_ROWS),li=R.getParameter(R.UNPACK_SKIP_IMAGES);R.pixelStorei(R.UNPACK_ROW_LENGTH,nt.width),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,nt.height),R.pixelStorei(R.UNPACK_SKIP_PIXELS,Re),R.pixelStorei(R.UNPACK_SKIP_ROWS,we),R.pixelStorei(R.UNPACK_SKIP_IMAGES,Me);const Qe=v.isDataArrayTexture||v.isData3DTexture,Dt=U.isDataArrayTexture||U.isData3DTexture;if(v.isDepthTexture){const Lt=xe.get(v),vt=xe.get(U),St=xe.get(Lt.__renderTarget),ds=xe.get(vt.__renderTarget);ve.bindFramebuffer(R.READ_FRAMEBUFFER,St.__webglFramebuffer),ve.bindFramebuffer(R.DRAW_FRAMEBUFFER,ds.__webglFramebuffer);for(let yn=0;yn<pe;yn++)Qe&&(R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,xe.get(v).__webglTexture,I,Me+yn),R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,xe.get(U).__webglTexture,Q,at+yn)),R.blitFramebuffer(Re,we,ie,de,Ge,je,ie,de,R.DEPTH_BUFFER_BIT,R.NEAREST);ve.bindFramebuffer(R.READ_FRAMEBUFFER,null),ve.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else if(I!==0||v.isRenderTargetTexture||xe.has(v)){const Lt=xe.get(v),vt=xe.get(U);ve.bindFramebuffer(R.READ_FRAMEBUFFER,So),ve.bindFramebuffer(R.DRAW_FRAMEBUFFER,yo);for(let St=0;St<pe;St++)Qe?R.framebufferTextureLayer(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,Lt.__webglTexture,I,Me+St):R.framebufferTexture2D(R.READ_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,Lt.__webglTexture,I),Dt?R.framebufferTextureLayer(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,vt.__webglTexture,Q,at+St):R.framebufferTexture2D(R.DRAW_FRAMEBUFFER,R.COLOR_ATTACHMENT0,R.TEXTURE_2D,vt.__webglTexture,Q),I!==0?R.blitFramebuffer(Re,we,ie,de,Ge,je,ie,de,R.COLOR_BUFFER_BIT,R.NEAREST):Dt?R.copyTexSubImage3D(ft,Q,Ge,je,at+St,Re,we,ie,de):R.copyTexSubImage2D(ft,Q,Ge,je,Re,we,ie,de);ve.bindFramebuffer(R.READ_FRAMEBUFFER,null),ve.bindFramebuffer(R.DRAW_FRAMEBUFFER,null)}else Dt?v.isDataTexture||v.isData3DTexture?R.texSubImage3D(ft,Q,Ge,je,at,ie,de,pe,He,Se,nt.data):U.isCompressedArrayTexture?R.compressedTexSubImage3D(ft,Q,Ge,je,at,ie,de,pe,He,nt.data):R.texSubImage3D(ft,Q,Ge,je,at,ie,de,pe,He,Se,nt):v.isDataTexture?R.texSubImage2D(R.TEXTURE_2D,Q,Ge,je,ie,de,He,Se,nt.data):v.isCompressedTexture?R.compressedTexSubImage2D(R.TEXTURE_2D,Q,Ge,je,nt.width,nt.height,He,nt.data):R.texSubImage2D(R.TEXTURE_2D,Q,Ge,je,ie,de,He,Se,nt);R.pixelStorei(R.UNPACK_ROW_LENGTH,We),R.pixelStorei(R.UNPACK_IMAGE_HEIGHT,Bt),R.pixelStorei(R.UNPACK_SKIP_PIXELS,On),R.pixelStorei(R.UNPACK_SKIP_ROWS,At),R.pixelStorei(R.UNPACK_SKIP_IMAGES,li),Q===0&&U.generateMipmaps&&R.generateMipmap(ft),ve.unbindTexture()},this.copyTextureToTexture3D=function(v,U,B=null,G=null,I=0){return es('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(v,U,B,G,I)},this.initRenderTarget=function(v){xe.get(v).__webglFramebuffer===void 0&&b.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?b.setTextureCube(v,0):v.isData3DTexture?b.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?b.setTexture2DArray(v,0):b.setTexture2D(v,0),ve.unbindTexture()},this.resetState=function(){C=0,w=0,L=null,ve.reset(),Ze.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return sn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=ke._getDrawingBufferColorSpace(e),t.unpackColorSpace=ke._getUnpackColorSpace()}}const Ff=()=>{const i=ht.useRef(null);return ht.useEffect(()=>{if(!i.current)return;const e=new Wl,t=new Ft(90,i.current.clientWidth/i.current.clientHeight,.01,1e3),n=new If({antialias:!0,alpha:!0});n.setSize(i.current.clientWidth,i.current.clientHeight),i.current.appendChild(n.domElement),t.position.z=60;const s=13041721,r=796120,a=16777215,o=new Or(.3,.3,6,32),c=new Br(.8,32,32),d=new mi({color:s}),f=new mi({color:r}),p=new mi({color:a}),h=new _t,m=new _t;for(let u=0;u<=33;u++){const A=new Rt(o,f);A.rotation.z=90*Math.PI/180,A.position.x=-3;const T=new Rt(o,d);T.rotation.z=90*Math.PI/180,T.position.x=3;const E=new Rt(c,p);E.position.x=6;const D=new Rt(c,p);D.position.x=-6;const C=new _t;C.add(A),C.add(T),C.add(E),C.add(D),C.position.y=u*2,C.rotation.y=10*u*Math.PI/180,h.add(C)}h.position.y=-33,m.add(h),e.add(m);const _=()=>{requestAnimationFrame(_),m.rotation.x+=.01,m.rotation.y+=.015,n.render(e,t)};_();const S=i.current,g=()=>{S&&(t.aspect=S.clientWidth/S.clientHeight,t.updateProjectionMatrix(),n.setSize(S.clientWidth,S.clientHeight))};return window.addEventListener("resize",g),()=>{window.removeEventListener("resize",g),S&&S.removeChild(n.domElement)}},[]),l.jsx("div",{ref:i,style:{width:"100%",height:"250px"}})};function Of(){const[i,e]=ht.useState(null),t={"double-helix":{title:"Double Helix Structure",description:"Two antiparallel strands wound around each other, providing stability and protection for genetic information."},"base-pairs":{title:"Base Pairing",description:"A-T and G-C base pairs held together by hydrogen bonds, enabling accurate replication."},backbone:{title:"Sugar-Phosphate Backbone",description:"Provides structural support and directional polarity (5' to 3') essential for DNA function."},nucleotides:{title:"Nucleotides",description:"Building blocks of DNA consisting of a base, sugar, and phosphate group."}};return l.jsx("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:l.jsxs("div",{className:"grid md:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"relative",children:[l.jsxs("div",{className:"aspect-square bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue/50 rounded-lg flex items-center justify-center",children:[l.jsx(Ff,{}),l.jsxs("div",{className:"absolute inset-0",children:[l.jsx("button",{onClick:()=>e("double-helix"),className:"absolute top-1/4 left-1/2 w-4 h-4 bg-sp-pale-green rounded-full hover:scale-125 transition-transform",title:"Double Helix"}),l.jsx("button",{onClick:()=>e("base-pairs"),className:"absolute top-1/2 left-1/3 w-4 h-4 bg-blue-400 rounded-full hover:scale-125 transition-transform",title:"Base Pairs"}),l.jsx("button",{onClick:()=>e("backbone"),className:"absolute top-1/3 left-1/4 w-4 h-4 bg-red-400 rounded-full hover:scale-125 transition-transform",title:"Backbone"}),l.jsx("button",{onClick:()=>e("nucleotides"),className:"absolute top-2/3 left-2/3 w-4 h-4 bg-yellow-400 rounded-full hover:scale-125 transition-transform",title:"Nucleotides"})]})]}),l.jsx("p",{className:"text-xs text-sp-white/60 mt-2 text-center",children:"Click the colored dots to explore DNA structure"})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"DNA Structure Explorer"}),i?l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-2",children:t[i].title}),l.jsx("p",{className:"text-sm text-sp-white/80",children:t[i].description})]}):l.jsx("p",{className:"text-sp-white/60 text-sm",children:"Click on the highlighted points in the DNA structure to learn about different components."})]})]})})}function Bf(){const[i,e]=ht.useState(null),[t,n]=ht.useState([]),s={phosphate:{title:"Phosphate Group",description:"Negatively charged group that forms the backbone of DNA and creates the molecule's polarity.",color:"bg-red-400"},sugar:{title:"Deoxyribose Sugar",description:"Five-carbon sugar that lacks one hydroxyl group, making DNA more stable than RNA.",color:"bg-blue-400"},adenine:{title:"Adenine (A)",description:"Purine base that pairs with thymine via 2 hydrogen bonds. Essential for ATP and genetic coding.",color:"bg-green-400"},thymine:{title:"Thymine (T)",description:"Pyrimidine base that pairs with adenine. Unique to DNA (RNA uses uracil instead).",color:"bg-yellow-400"},guanine:{title:"Guanine (G)",description:"Purine base that pairs with cytosine via 3 hydrogen bonds, creating stronger base pairs.",color:"bg-purple-400"},cytosine:{title:"Cytosine (C)",description:"Pyrimidine base that pairs with guanine. Important in epigenetic modifications.",color:"bg-orange-400"}},r=a=>{t.includes(a)?n(t.filter(o=>o!==a)):n([...t,a])};return l.jsxs("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:[l.jsxs("div",{className:"grid lg:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"DNA Components"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Highlight Nucleotides:"}),l.jsx("div",{className:"grid grid-cols-2 gap-2",children:["adenine","thymine","guanine","cytosine"].map(a=>l.jsx("button",{onClick:()=>r(a),className:`p-2 rounded text-sm font-semibold transition-all ${t.includes(a)?`${s[a].color} text-gray-900 scale-105`:"bg-gray-600 text-white hover:bg-gray-500"}`,children:a.charAt(0).toUpperCase()+a.slice(1)},a))})]}),i&&l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-2",children:s[i].title}),l.jsx("p",{className:"text-sm text-sp-white/80",children:s[i].description})]})]}),l.jsxs("div",{className:"relative",children:[l.jsx("div",{className:"aspect-square bg-gradient-to-br from-sp-pale-green/20 to-sp-dark-blue/50 rounded-lg p-4",children:l.jsx("div",{className:"h-full flex flex-col justify-center items-center space-y-2",children:l.jsxs("div",{className:"text-center space-y-1",children:[l.jsx("div",{className:"text-sm text-sp-white/60 mb-2",children:"5' → 3'"}),["A-T","G-C","T-A","C-G","A-T"].map((a,o)=>l.jsxs("div",{className:"flex items-center justify-center space-x-2",children:[l.jsx("button",{onClick:()=>e(a.split("-")[0].toLowerCase()==="a"?"adenine":a.split("-")[0].toLowerCase()==="g"?"guanine":a.split("-")[0].toLowerCase()==="t"?"thymine":"cytosine"),className:`w-8 h-8 rounded font-bold text-sm transition-all ${t.includes(a.split("-")[0].toLowerCase()==="a"?"adenine":a.split("-")[0].toLowerCase()==="g"?"guanine":a.split("-")[0].toLowerCase()==="t"?"thymine":"cytosine")?`${s[a.split("-")[0].toLowerCase()==="a"?"adenine":a.split("-")[0].toLowerCase()==="g"?"guanine":a.split("-")[0].toLowerCase()==="t"?"thymine":"cytosine"].color} scale-110 shadow-lg`:"bg-gray-600 hover:bg-gray-500"} text-white`,children:a.split("-")[0]}),l.jsx("div",{className:"text-sp-white/40",children:"—"}),l.jsx("button",{onClick:()=>e(a.split("-")[1].toLowerCase()==="a"?"adenine":a.split("-")[1].toLowerCase()==="g"?"guanine":a.split("-")[1].toLowerCase()==="t"?"thymine":"cytosine"),className:`w-8 h-8 rounded font-bold text-sm transition-all ${t.includes(a.split("-")[1].toLowerCase()==="a"?"adenine":a.split("-")[1].toLowerCase()==="g"?"guanine":a.split("-")[1].toLowerCase()==="t"?"thymine":"cytosine")?`${s[a.split("-")[1].toLowerCase()==="a"?"adenine":a.split("-")[1].toLowerCase()==="g"?"guanine":a.split("-")[1].toLowerCase()==="t"?"thymine":"cytosine"].color} scale-110 shadow-lg`:"bg-gray-600 hover:bg-gray-500"} text-white`,children:a.split("-")[1]})]},o)),l.jsx("div",{className:"text-sm text-sp-white/60 mt-2",children:"3' ← 5'"})]})})}),l.jsxs("div",{className:"absolute top-2 left-2 space-y-1",children:[l.jsx("button",{onClick:()=>e("phosphate"),className:"w-3 h-3 bg-red-400 rounded-full hover:scale-125 transition-transform",title:"Phosphate Group"}),l.jsx("button",{onClick:()=>e("sugar"),className:"w-3 h-3 bg-blue-400 rounded-full hover:scale-125 transition-transform",title:"Sugar"})]})]})]}),l.jsx("div",{className:"mt-4 text-xs text-sp-white/60 text-center",children:"Click on nucleotides to highlight them, or click the colored dots to learn about DNA components"})]})}function zf(){const[i,e]=ht.useState({flowerColor:"red",petalShape:"round",plantHeight:"medium"}),t={flowerColor:{name:"Flower Color",alleles:{red:{genotype:"RR",phenotype:"Red Flowers",color:"#DC2626"},pink:{genotype:"Rr",phenotype:"Pink Flowers",color:"#EC4899"},white:{genotype:"rr",phenotype:"White Flowers",color:"#F3F4F6"}}},petalShape:{name:"Petal Shape",alleles:{round:{genotype:"SS",phenotype:"Round Petals",shape:"round"},pointed:{genotype:"Ss",phenotype:"Pointed Petals",shape:"pointed"},wavy:{genotype:"ss",phenotype:"Wavy Petals",shape:"wavy"}}},plantHeight:{name:"Plant Height",alleles:{tall:{genotype:"HH",phenotype:"Tall Plant (>4ft)",size:"tall"},medium:{genotype:"Hh",phenotype:"Medium Plant (2-4ft)",size:"medium"},short:{genotype:"hh",phenotype:"Short Plant (<2ft)",size:"short"}}}},n=(s,r)=>{e({...i,[s]:r})};return l.jsxs("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:[l.jsxs("div",{className:"grid lg:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Select Genotypes"}),Object.entries(t).map(([s,r])=>l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:r.name}),l.jsx("div",{className:"space-y-2",children:Object.entries(r.alleles).map(([a,o])=>l.jsxs("label",{className:"flex items-center space-x-3 cursor-pointer",children:[l.jsx("input",{type:"radio",name:s,value:a,checked:i[s]===a,onChange:c=>n(s,c.target.value),className:"w-4 h-4 text-sp-pale-green"}),l.jsxs("div",{children:[l.jsx("span",{className:"text-sp-white font-medium",children:o.genotype}),l.jsxs("span",{className:"text-sp-white/70 text-sm ml-2",children:["→ ",o.phenotype]})]})]},a))})]},s))]}),l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Resulting Phenotype"}),l.jsx("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-6 text-center",children:l.jsxs("div",{className:"relative mx-auto flex flex-col items-center",style:{width:"200px",height:"240px"},children:[l.jsx("div",{className:"relative mb-2",children:i.petalShape==="round"?l.jsxs("div",{className:"relative w-16 h-16",children:[[0,1,2,3,4].map(s=>l.jsx("div",{className:"absolute w-6 h-6 rounded-full",style:{backgroundColor:t.flowerColor.alleles[i.flowerColor].color,transform:`rotate(${s*72}deg) translate(20px) rotate(-${s*72}deg)`,left:"50%",top:"50%",marginLeft:"-12px",marginTop:"-12px"}},s)),l.jsx("div",{className:"absolute w-4 h-4 bg-yellow-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"})]}):i.petalShape==="pointed"?l.jsxs("div",{className:"relative w-16 h-16",children:[[0,1,2,3,4].map(s=>l.jsx("div",{className:"absolute w-0 h-0",style:{borderLeft:"8px solid transparent",borderRight:"8px solid transparent",borderBottom:`16px solid ${t.flowerColor.alleles[i.flowerColor].color}`,transform:`rotate(${s*72}deg) translate(18px) rotate(-${s*72}deg)`,left:"50%",top:"50%",marginLeft:"-8px",marginTop:"-8px"}},s)),l.jsx("div",{className:"absolute w-4 h-4 bg-yellow-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"})]}):l.jsxs("div",{className:"relative w-16 h-16",children:[[0,1,2,3,4].map(s=>l.jsx("div",{className:"absolute w-5 h-8 rounded-full",style:{backgroundColor:t.flowerColor.alleles[i.flowerColor].color,transform:`rotate(${s*72}deg) translate(20px) rotate(-${s*72}deg) skew(10deg)`,left:"50%",top:"50%",marginLeft:"-10px",marginTop:"-16px"}},s)),l.jsx("div",{className:"absolute w-4 h-4 bg-yellow-400 rounded-full left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"})]})}),l.jsx("div",{className:"w-1 bg-green-600 rounded",style:{height:i.plantHeight==="tall"?"140px":i.plantHeight==="medium"?"100px":"60px"}}),l.jsx("div",{className:"absolute",style:{top:"80px",left:"85px"},children:l.jsx("div",{className:"w-4 h-2 bg-green-500 rounded-full transform rotate-45"})}),l.jsx("div",{className:"absolute",style:{top:"100px",left:"105px"},children:l.jsx("div",{className:"w-4 h-2 bg-green-500 rounded-full transform -rotate-45"})}),l.jsx("div",{className:"w-20 h-8 bg-amber-800 rounded-b-lg mt-2"})]})}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-2",children:"Current Phenotype:"}),l.jsx("ul",{className:"space-y-1 text-sm text-sp-white/80",children:Object.entries(i).map(([s,r])=>l.jsxs("li",{children:["• ",t[s].alleles[r].phenotype]},s))})]})]})]}),l.jsx("div",{className:"mt-4 text-xs text-sp-white/60 text-center",children:"Change the genotype selections to see how different allele combinations produce different flower phenotypes"})]})}function Gf(){const[i,e]=ht.useState(null),[t,n]=ht.useState(!1),[s,r]=ht.useState([{generation:0,diversity:.15,individuals:5},{generation:1,diversity:.18,individuals:8},{generation:2,diversity:.22,individuals:12},{generation:3,diversity:.19,individuals:10},{generation:4,diversity:.25,individuals:15}]),a="ATCGATCGTAGC",o="ATCGATCGTGGC",[c,d]=ht.useState(a),f=h=>{e(h),h===9&&(n(!t),d(t?a:o))},p=[{name:"Mutation",description:"Creates new alleles through DNA replication errors",impact:"+",color:"bg-red-400"},{name:"Recombination",description:"Shuffles existing alleles into new combinations",impact:"+",color:"bg-blue-400"},{name:"Gene Flow",description:"Introduces alleles from other populations",impact:"+",color:"bg-green-400"},{name:"Genetic Drift",description:"Random sampling can reduce diversity",impact:"±",color:"bg-yellow-400"}];return l.jsxs("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:[l.jsxs("div",{className:"grid lg:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Mutation at the DNA Level"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("p",{className:"text-sm text-sp-white/80 mb-3",children:"Click position 10 (A) to simulate a point mutation:"}),l.jsx("div",{className:"font-mono text-lg text-center bg-gray-800 rounded p-3",children:c.split("").map((h,m)=>l.jsx("button",{onClick:()=>f(m),className:`mx-1 px-2 py-1 rounded transition-all ${m===9?"bg-red-500 text-white hover:bg-red-600 cursor-pointer":i===m?"bg-sp-pale-green text-sp-very-dark-blue":"hover:bg-gray-700"} ${m===9&&t?"ring-2 ring-yellow-400":""}`,title:m===9?"Click to mutate A→G":`Position ${m+1}: ${h}`,children:h},m))}),i!==null&&l.jsxs("div",{className:"mt-3 text-sm text-sp-white/80",children:[l.jsxs("p",{children:[l.jsxs("strong",{children:["Position ",i+1,":"]})," ",c[i]]}),i===9&&l.jsxs("p",{className:"text-yellow-400 mt-1",children:["💡 ",t?"Mutation occurred! A→G creates a new allele.":"Click to create a point mutation."]})]})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Sources of Genetic Variation"}),l.jsx("div",{className:"space-y-2",children:p.map((h,m)=>l.jsxs("div",{className:"flex items-center space-x-3 p-2 rounded bg-gray-800/50",children:[l.jsx("div",{className:`w-3 h-3 ${h.color} rounded-full`}),l.jsxs("div",{className:"flex-1",children:[l.jsxs("div",{className:"flex items-center space-x-2",children:[l.jsx("span",{className:"font-medium text-sp-white",children:h.name}),l.jsx("span",{className:`text-sm px-1 rounded ${h.impact==="+"?"bg-green-600 text-white":"bg-yellow-600 text-white"}`,children:h.impact})]}),l.jsx("p",{className:"text-xs text-sp-white/70",children:h.description})]})]},m))})]})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Diversity Across Generations"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("div",{className:"space-y-3",children:s.map((h,m)=>l.jsxs("div",{className:"flex items-center space-x-3",children:[l.jsxs("div",{className:"text-sm font-medium text-sp-white w-16",children:["Gen ",h.generation]}),l.jsxs("div",{className:"flex-1 bg-gray-700 rounded-full h-6 relative",children:[l.jsx("div",{className:"bg-gradient-to-r from-sp-pale-green to-green-400 h-full rounded-full transition-all duration-500",style:{width:`${h.diversity*100}%`}}),l.jsxs("div",{className:"absolute inset-0 flex items-center justify-center text-xs font-medium text-white",children:["π = ",h.diversity.toFixed(3)]})]}),l.jsxs("div",{className:"text-xs text-sp-white/60 w-12",children:[h.individuals," ind."]})]},m))}),l.jsx("div",{className:"mt-4 p-3 bg-sp-pale-green/10 rounded border-l-4 border-sp-pale-green",children:l.jsxs("p",{className:"text-sm text-sp-white/80",children:[l.jsx("strong",{children:"Notice:"})," Genetic diversity (π) fluctuates due to the balance between processes that increase variation (mutation, gene flow) and those that decrease it (drift, selection)."]})})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Simulate Population Events"}),l.jsxs("div",{className:"space-y-2",children:[l.jsx("button",{onClick:()=>{const h=[...s];h.push({generation:h.length,diversity:Math.min(.3,h[h.length-1].diversity+.03),individuals:h[h.length-1].individuals+Math.floor(Math.random()*5)}),r(h)},className:"w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm text-white font-medium transition-colors",children:"+ Add Migration Event (↑ Diversity)"}),l.jsx("button",{onClick:()=>{const h=[...s];h.push({generation:h.length,diversity:Math.max(.05,h[h.length-1].diversity-.05),individuals:Math.max(3,h[h.length-1].individuals-Math.floor(Math.random()*3))}),r(h)},className:"w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm text-white font-medium transition-colors",children:"- Add Bottleneck Event (↓ Diversity)"})]})]})]})]}),l.jsx("div",{className:"mt-4 text-xs text-sp-white/60 text-center",children:"Interact with the DNA sequence above and simulate population events to see how genetic diversity changes"})]})}function Hf(){const[i,e]=ht.useState("human"),[t,n]=ht.useState(!1),s={human:{name:"Human Population",sequences:["ATCGATCGTAGC","ATCGATCGTGGC","ATCGACCGTAGC","ATCGATCGTAGC","TTCGATCGTAGC"],description:"Sample from human genomic region",realWorldContext:"Human genome-wide average π ≈ 0.001"},drosophila:{name:"Drosophila Population",sequences:["ATCGATCGTAGC","GTCGATCGTAGC","ATCGTTCGTAGC","ATCGATGGTAGC","ATCGATCGTAAC"],description:"Sample from fruit fly population",realWorldContext:"Drosophila typically has π ≈ 0.01-0.02"},bacteria:{name:"Bacterial Strain",sequences:["ATCGATCGTAGC","ATCGATCGTAGC","ATCGATCGTAGC","ATCGATCGTGGC","ATCGATCGTAGC"],description:"Clonal bacterial population",realWorldContext:"Bacteria show low π due to clonal reproduction"}},r=f=>{const p=f.length,h=f[0].length;let m=0,_=0;for(let g=0;g<p;g++)for(let u=g+1;u<p;u++){_++;for(let A=0;A<h;A++)f[g][A]!==f[u][A]&&m++}return{pi:_>0?m/(_*h):0,totalDifferences:m,totalComparisons:_,seqLength:h}},a=s[i],o=r(a.sequences),c=f=>f<.05?"text-red-400":f<.15?"text-yellow-400":"text-green-400",d=f=>f<.05?"Low genetic diversity":f<.15?"Moderate genetic diversity":"High genetic diversity";return l.jsxs("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:[l.jsxs("div",{className:"grid lg:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Nucleotide Diversity Calculator"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Select Dataset:"}),l.jsx("div",{className:"space-y-2",children:Object.entries(s).map(([f,p])=>l.jsxs("label",{className:"flex items-center space-x-3 cursor-pointer",children:[l.jsx("input",{type:"radio",name:"dataset",value:f,checked:i===f,onChange:h=>e(h.target.value),className:"w-4 h-4 text-sp-pale-green"}),l.jsxs("div",{children:[l.jsx("span",{className:"text-sp-white font-medium",children:p.name}),l.jsx("p",{className:"text-xs text-sp-white/70",children:p.description})]})]},f))})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Sequence Alignment"}),l.jsx("div",{className:"font-mono text-sm space-y-1",children:a.sequences.map((f,p)=>l.jsxs("div",{className:"flex items-center space-x-2",children:[l.jsxs("span",{className:"text-sp-white/60 w-8",children:["#",p+1]}),l.jsx("div",{className:"flex",children:f.split("").map((h,m)=>{const _=a.sequences.map(u=>u[m]),S=new Set(_).size>1,g=_[0]!==h;return l.jsx("span",{className:`px-1 ${S&&g?"bg-yellow-600 text-white rounded":S?"bg-yellow-600/30 text-yellow-200":"text-sp-white/80"}`,children:h},m)})})]},p))}),l.jsx("p",{className:"text-xs text-sp-white/60 mt-2",children:"Yellow highlighting shows variable positions"})]})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Diversity Analysis"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsxs("div",{className:"text-center",children:[l.jsx("div",{className:"text-3xl font-bold mb-2",children:l.jsxs("span",{className:c(o.pi),children:["π = ",o.pi.toFixed(4)]})}),l.jsx("p",{className:`text-sm font-medium ${c(o.pi)}`,children:d(o.pi)})]}),l.jsxs("div",{className:"mt-4 space-y-2 text-sm text-sp-white/80",children:[l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{children:"Total differences:"}),l.jsx("span",{className:"font-mono",children:o.totalDifferences})]}),l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{children:"Pairwise comparisons:"}),l.jsx("span",{className:"font-mono",children:o.totalComparisons})]}),l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{children:"Sequence length:"}),l.jsx("span",{className:"font-mono",children:o.seqLength})]})]})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsxs("div",{className:"flex items-center justify-between mb-3",children:[l.jsx("h4",{className:"font-semibold text-sp-white",children:"Calculation Steps"}),l.jsxs("button",{onClick:()=>n(!t),className:"text-sp-pale-green hover:text-sp-pale-green/80 transition-colors",children:[t?"Hide":"Show"," Formula"]})]}),t&&l.jsxs("div",{className:"space-y-3 text-sm",children:[l.jsx("div",{className:"bg-gray-800 rounded p-3 font-mono text-center",children:"π = Σ(differences) / (comparisons × sequence_length)"}),l.jsxs("div",{className:"space-y-2 text-sp-white/80",children:[l.jsxs("p",{children:[l.jsx("strong",{children:"Step 1:"})," Compare all pairs of sequences"]}),l.jsxs("p",{children:[l.jsx("strong",{children:"Step 2:"})," Count nucleotide differences at each position"]}),l.jsxs("p",{children:[l.jsx("strong",{children:"Step 3:"})," Divide by total possible differences"]}),l.jsx("div",{className:"bg-sp-pale-green/10 p-2 rounded border-l-4 border-sp-pale-green",children:l.jsxs("p",{className:"text-xs",children:["π = ",o.totalDifferences," / (",o.totalComparisons," × ",o.seqLength,") = ",o.pi.toFixed(4)]})})]})]})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-2",children:"Real-world Context"}),l.jsx("p",{className:"text-sm text-sp-white/80 mb-2",children:a.realWorldContext}),l.jsxs("div",{className:"text-xs text-sp-white/60",children:[l.jsx("p",{children:l.jsx("strong",{children:"Applications:"})}),l.jsxs("ul",{className:"list-disc list-inside space-y-1",children:[l.jsx("li",{children:"Conservation genetics (population health)"}),l.jsx("li",{children:"Medical genetics (disease susceptibility)"}),l.jsx("li",{children:"Evolutionary biology (selection signatures)"}),l.jsx("li",{children:"Agriculture (crop breeding programs)"})]})]})]})]})]}),l.jsx("div",{className:"mt-4 text-xs text-sp-white/60 text-center",children:"Try different datasets to see how nucleotide diversity varies across species and populations"})]})}function kf(){const i=[{question:"What provides DNA with its structural stability and allows for accurate replication?",options:["Random base arrangement","Complementary base pairing (A-T, G-C)","Single-strand structure","Protein coating"],correctAnswer:"Complementary base pairing (A-T, G-C)",explanation:"The complementary base pairing rules create a stable double helix and enable each strand to serve as a template for accurate replication."},{question:"What is the relationship between genes and alleles?",options:["They are the same thing","Genes are locations; alleles are the different versions found there","Alleles are larger than genes","Genes create alleles through translation"],correctAnswer:"Genes are locations; alleles are the different versions found there",explanation:"A gene is a specific location (locus) on DNA, while alleles are the different variants of DNA sequence that can exist at that location."},{question:"Why is genetic variation crucial for populations?",options:["It makes individuals identical","It provides raw material for evolution and adaptation","It prevents reproduction","It eliminates mutations"],correctAnswer:"It provides raw material for evolution and adaptation",explanation:"Genetic variation gives populations the flexibility to adapt to changing environments and survive challenges through natural selection."}];return l.jsxs("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green mb-4",children:"Quick Self-Check"}),l.jsx("div",{className:"space-y-6",children:i.map((e,t)=>l.jsx(Eo,{question:e.question,options:e.options,correctAnswer:e.correctAnswer,explanation:e.explanation},t))}),l.jsx("div",{className:"mt-4 text-xs text-sp-white/60 text-center",children:"Answer each question to receive immediate feedback and explanations"})]})}function Vf(){var E,D,C;const[i,e]=ht.useState([{id:1,genotype:"AA",count:25,description:"Homozygous dominant"},{id:2,genotype:"Aa",count:50,description:"Heterozygous"},{id:3,genotype:"aa",count:25,description:"Homozygous recessive"}]),[t,n]=ht.useState("balanced"),s={balanced:[{id:1,genotype:"AA",count:25,description:"Homozygous dominant"},{id:2,genotype:"Aa",count:50,description:"Heterozygous"},{id:3,genotype:"aa",count:25,description:"Homozygous recessive"}],dominant:[{id:1,genotype:"AA",count:64,description:"Homozygous dominant"},{id:2,genotype:"Aa",count:32,description:"Heterozygous"},{id:3,genotype:"aa",count:4,description:"Homozygous recessive"}],rare:[{id:1,genotype:"AA",count:90,description:"Homozygous dominant"},{id:2,genotype:"Aa",count:9,description:"Heterozygous"},{id:3,genotype:"aa",count:1,description:"Homozygous recessive"}]},r=w=>{n(w),e(s[w])},a=(w,L)=>{e(y=>y.map(M=>M.id===w?{...M,count:Math.max(0,L)}:M))},o=i.reduce((w,L)=>w+L.count,0),c=o*2,d=((E=i.find(w=>w.genotype==="AA"))==null?void 0:E.count)||0,f=((D=i.find(w=>w.genotype==="Aa"))==null?void 0:D.count)||0,p=((C=i.find(w=>w.genotype==="aa"))==null?void 0:C.count)||0,h=c>0?(2*d+f)/c:0,m=1-h,_=o>0?d/o:0,S=o>0?f/o:0,g=o>0?p/o:0,u=w=>w>.5?{type:"Major",color:"text-green-400"}:w>.05?{type:"Minor",color:"text-yellow-400"}:{type:"Rare",color:"text-red-400"},A=u(h),T=u(m);return l.jsx("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:l.jsxs("div",{className:"grid lg:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Population Data"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Example Populations"}),l.jsx("div",{className:"space-y-2",children:Object.entries(s).map(([w,L])=>l.jsxs("label",{className:"flex items-center space-x-3 cursor-pointer",children:[l.jsx("input",{type:"radio",name:"example",value:w,checked:t===w,onChange:y=>r(y.target.value),className:"w-4 h-4 text-sp-pale-green"}),l.jsxs("span",{className:"text-sp-white capitalize",children:[w," Population"]})]},w))})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Genotype Counts"}),l.jsx("div",{className:"space-y-3",children:i.map(w=>l.jsxs("div",{className:"flex items-center space-x-3",children:[l.jsx("div",{className:"w-8 text-sp-white font-mono font-bold",children:w.genotype}),l.jsx("input",{type:"number",value:w.count,onChange:L=>a(w.id,parseInt(L.target.value)||0),className:"w-20 px-2 py-1 bg-gray-700 text-white rounded",min:"0"}),l.jsx("div",{className:"text-sm text-sp-white/70",children:w.description})]},w.id))})]})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Allele Frequency Analysis"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Calculations"}),l.jsxs("div",{className:"space-y-3 text-sm",children:[l.jsxs("div",{className:"bg-gray-800 rounded p-3",children:[l.jsx("div",{className:"font-mono text-sp-pale-green mb-2",children:"p = (2N₁₁ + N₁₂) / 2N"}),l.jsxs("div",{className:"text-sp-white/80",children:["p = (2×",d," + ",f,") / (2×",o,") = ",h.toFixed(4)]})]}),l.jsxs("div",{className:"bg-gray-800 rounded p-3",children:[l.jsx("div",{className:"font-mono text-sp-pale-green mb-2",children:"q = 1 - p"}),l.jsxs("div",{className:"text-sp-white/80",children:["q = 1 - ",h.toFixed(4)," = ",m.toFixed(4)]})]})]})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Allele Classification"}),l.jsxs("div",{className:"space-y-3",children:[l.jsxs("div",{className:"flex items-center justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"A allele frequency:"}),l.jsxs("div",{className:"text-right",children:[l.jsx("div",{className:"font-mono text-sp-white",children:h.toFixed(4)}),l.jsxs("div",{className:`text-xs ${A.color}`,children:[A.type," Allele"]})]})]}),l.jsxs("div",{className:"flex items-center justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"a allele frequency:"}),l.jsxs("div",{className:"text-right",children:[l.jsx("div",{className:"font-mono text-sp-white",children:m.toFixed(4)}),l.jsxs("div",{className:`text-xs ${T.color}`,children:[T.type," Allele"]})]})]})]})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Genotype Frequencies"}),l.jsxs("div",{className:"space-y-2 text-sm",children:[l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"f₁₁ (AA):"}),l.jsx("span",{className:"font-mono text-sp-white",children:_.toFixed(4)})]}),l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"f₁₂ (Aa):"}),l.jsx("span",{className:"font-mono text-sp-white",children:S.toFixed(4)})]}),l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"f₂₂ (aa):"}),l.jsx("span",{className:"font-mono text-sp-white",children:g.toFixed(4)})]})]})]}),l.jsxs("div",{className:"bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20",children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Key Insights"}),l.jsxs("ul",{className:"text-xs text-sp-white/80 space-y-1",children:[l.jsx("li",{children:"• Allele frequencies sum to 1.0"}),l.jsx("li",{children:"• Major alleles (>50%) are most common"}),l.jsx("li",{children:"• Minor alleles (5-50%) provide diversity"}),l.jsx("li",{children:"• Rare alleles (<5%) may be lost over time"})]})]})]})]})})}function jf(){const[i,e]=ht.useState("neutral"),[t,n]=ht.useState(10),s={neutral:{name:"Neutral Evolution",description:"Expected pattern under neutral evolution",data:[8,4,3,2,2,1,1,1,0,0],color:"#3b82f6"},expansion:{name:"Population Expansion",description:"Excess of rare variants from recent growth",data:[15,8,4,2,1,1,0,0,0,0],color:"#10b981"},bottleneck:{name:"Population Bottleneck",description:"Reduced diversity from population crash",data:[3,1,1,1,1,1,1,1,0,0],color:"#ef4444"},selection:{name:"Balancing Selection",description:"Elevated intermediate frequencies",data:[5,2,2,3,4,4,3,2,1,0],color:"#f59e0b"}},r=s[i],o=r.data.slice(0,t-1).map((f,p)=>({frequency:p+1,count:Math.round(f*(t/10))})),c=Math.max(...o.map(d=>d.count));return l.jsx("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:l.jsxs("div",{className:"grid lg:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Site Frequency Spectrum"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Dataset Selection"}),l.jsx("div",{className:"space-y-2",children:Object.entries(s).map(([d,f])=>l.jsxs("label",{className:"flex items-center space-x-3 cursor-pointer",children:[l.jsx("input",{type:"radio",name:"dataset",value:d,checked:i===d,onChange:p=>e(p.target.value),className:"w-4 h-4 text-sp-pale-green"}),l.jsxs("div",{children:[l.jsx("span",{className:"text-sp-white font-medium",children:f.name}),l.jsx("div",{className:"text-xs text-sp-white/70",children:f.description})]})]},d))})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Sample Size"}),l.jsxs("div",{className:"space-y-2",children:[l.jsx("input",{type:"range",min:"5",max:"20",value:t,onChange:d=>n(parseInt(d.target.value)),className:"w-full"}),l.jsxs("div",{className:"text-center text-sp-white",children:[t," chromosomes"]})]})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"About the SFS"}),l.jsxs("div",{className:"text-sm text-sp-white/80 space-y-2",children:[l.jsx("p",{children:"The Site Frequency Spectrum shows how many sites have derived alleles at each frequency."}),l.jsx("p",{children:"The x-axis represents the number of chromosomes carrying the derived allele."}),l.jsx("p",{children:"The y-axis represents the count of sites with that frequency."})]})]})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsxs("h3",{className:"text-lg font-semibold text-sp-pale-green",children:[r.name," Pattern"]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("div",{className:"h-64 flex items-end space-x-2",children:o.map((d,f)=>l.jsxs("div",{className:"flex-1 flex flex-col items-center",children:[l.jsx("div",{className:"w-full transition-all duration-500",style:{height:`${d.count/c*200}px`,backgroundColor:r.color,minHeight:"2px"}}),l.jsx("div",{className:"text-xs text-sp-white/70 mt-1",children:d.frequency})]},f))}),l.jsx("div",{className:"text-center text-xs text-sp-white/60 mt-2",children:"Derived Allele Frequency (number of chromosomes)"})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Pattern Interpretation"}),l.jsxs("div",{className:"text-sm text-sp-white/80",children:[l.jsx("p",{className:"mb-2",children:r.description}),l.jsxs("div",{className:"space-y-1",children:[i==="neutral"&&l.jsx("p",{children:"• Neutral evolution shows declining frequencies (1/f pattern)"}),i==="expansion"&&l.jsx("p",{children:"• Population expansion creates excess rare variants"}),i==="bottleneck"&&l.jsx("p",{children:"• Bottlenecks remove rare variants, flatten the spectrum"}),i==="selection"&&l.jsx("p",{children:"• Balancing selection maintains intermediate frequencies"})]})]})]}),l.jsxs("div",{className:"bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg p-4 border border-blue-500/30",children:[l.jsx("h4",{className:"font-semibold text-blue-300 mb-2",children:"Applications"}),l.jsxs("ul",{className:"text-sm text-sp-white/80 space-y-1",children:[l.jsx("li",{children:"• Detect population demographic changes"}),l.jsx("li",{children:"• Identify signatures of natural selection"}),l.jsx("li",{children:"• Estimate mutation rates and effective population size"}),l.jsx("li",{children:"• Compare populations and species"})]})]})]})]})})}function Wf(){const[i,e]=ht.useState(0),[t,n]=ht.useState(100),s=[{name:"Locus A",alleles:["A1","A2"],frequencies:[.8,.2],type:"Low Diversity",description:"Common in essential genes under purifying selection"},{name:"Locus B",alleles:["B1","B2","B3"],frequencies:[.6,.3,.1],type:"Moderate Diversity",description:"Typical pattern in most coding regions"},{name:"Locus C",alleles:["C1","C2","C3","C4","C5"],frequencies:[.35,.25,.2,.15,.05],type:"High Diversity",description:"Often seen in immune system genes"},{name:"Locus D",alleles:["D1"],frequencies:[1],type:"Monomorphic",description:"Fixed allele - no variation in population"}],r=s[i],a=r.alleles.length>1,o=r.alleles[0],c=r.frequencies[0],f=(()=>{const p=[];for(let h=0;h<r.alleles.length;h++)for(let m=h;m<r.alleles.length;m++){const _=r.alleles[h],S=r.alleles[m],g=r.frequencies[h],u=r.frequencies[m],A=h===m?g*u:2*g*u,T=Math.round(A*t);p.push({genotype:h===m?`${_}${_}`:`${_}${S}`,frequency:A,count:T,type:h===m?"Homozygote":"Heterozygote"})}return p.sort((h,m)=>m.frequency-h.frequency)})();return l.jsx("div",{className:"bg-sp-dark-blue/50 rounded-lg p-6",children:l.jsxs("div",{className:"grid lg:grid-cols-2 gap-6",children:[l.jsxs("div",{className:"space-y-4",children:[l.jsx("h3",{className:"text-lg font-semibold text-sp-pale-green",children:"Polymorphism Explorer"}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Select Locus"}),l.jsx("div",{className:"space-y-2",children:s.map((p,h)=>l.jsxs("label",{className:"flex items-center space-x-3 cursor-pointer",children:[l.jsx("input",{type:"radio",name:"locus",value:h,checked:i===h,onChange:m=>e(parseInt(m.target.value)),className:"w-4 h-4 text-sp-pale-green"}),l.jsxs("div",{children:[l.jsx("span",{className:"text-sp-white font-medium",children:p.name}),l.jsx("div",{className:"text-xs text-sp-white/70",children:p.type})]})]},h))})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Population Size"}),l.jsx("input",{type:"range",min:"50",max:"500",step:"50",value:t,onChange:p=>n(parseInt(p.target.value)),className:"w-full"}),l.jsxs("div",{className:"text-center text-sp-white mt-2",children:[t," individuals"]})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Locus Classification"}),l.jsxs("div",{className:"space-y-2 text-sm",children:[l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"Status:"}),l.jsx("span",{className:`font-medium ${a?"text-green-400":"text-red-400"}`,children:a?"Polymorphic":"Monomorphic"})]}),l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"Allele Count:"}),l.jsx("span",{className:"text-sp-white",children:r.alleles.length})]}),a&&l.jsxs(l.Fragment,{children:[l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"Major Allele:"}),l.jsxs("span",{className:"text-sp-pale-green",children:[o," (",(c*100).toFixed(1),"%)"]})]}),l.jsxs("div",{className:"flex justify-between",children:[l.jsx("span",{className:"text-sp-white",children:"Minor Alleles:"}),l.jsx("span",{className:"text-sp-white",children:r.alleles.length-1})]})]})]})]})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsxs("h3",{className:"text-lg font-semibold text-sp-pale-green",children:[r.name," Analysis"]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Allele Frequencies"}),l.jsx("div",{className:"space-y-2",children:r.alleles.map((p,h)=>{const m=r.frequencies[h],_=h===0;return l.jsxs("div",{className:"flex items-center space-x-3",children:[l.jsx("div",{className:"w-8 text-sp-white font-mono",children:p}),l.jsx("div",{className:"flex-1 bg-gray-700 rounded-full h-4 relative",children:l.jsx("div",{className:"bg-sp-pale-green h-full rounded-full transition-all duration-500",style:{width:`${m*100}%`}})}),l.jsxs("div",{className:"text-sm text-sp-white w-16",children:[(m*100).toFixed(1),"%"]}),l.jsx("div",{className:"text-xs text-sp-white/60 w-20",children:m>.5?"Major":m>.05?"Minor":"Rare"}),l.jsx("div",{className:"text-xs text-sp-white/60 w-20",children:_?"Ancestral":"Derived"})]},p)})})]}),a&&l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Expected Genotypes"}),l.jsx("div",{className:"space-y-2",children:f.map((p,h)=>l.jsxs("div",{className:"flex items-center justify-between",children:[l.jsxs("div",{className:"flex items-center space-x-3",children:[l.jsx("span",{className:"font-mono text-sp-white",children:p.genotype}),l.jsx("span",{className:"text-xs text-sp-white/70",children:p.type})]}),l.jsxs("div",{className:"text-right",children:[l.jsxs("div",{className:"text-sm text-sp-white",children:[p.count," individuals"]}),l.jsxs("div",{className:"text-xs text-sp-white/70",children:[(p.frequency*100).toFixed(1),"%"]})]})]},h))})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded-lg p-4",children:[l.jsx("h4",{className:"font-semibold text-sp-white mb-3",children:"Biological Context"}),l.jsx("p",{className:"text-sm text-sp-white/80 mb-2",children:r.description}),l.jsxs("div",{className:"space-y-1 text-xs text-sp-white/70",children:[r.type==="Monomorphic"&&l.jsx("p",{children:"• No genetic variation - all individuals have identical genotype"}),r.type==="Low Diversity"&&l.jsx("p",{children:"• Limited variation - one allele predominates"}),r.type==="Moderate Diversity"&&l.jsx("p",{children:"• Balanced variation - multiple alleles present"}),r.type==="High Diversity"&&l.jsx("p",{children:"• Extensive variation - many alleles maintained"})]})]})]})]})})}const Xf=[{question:"The lesson explained that DNA's structure enables accurate replication. Which specific feature allows each strand to serve as a template for creating its complement?",options:["The phosphodiester bonds create strong structural support","The antiparallel orientation prevents errors during copying","The complementary base pairing rules (A-T, G-C) ensure accurate matching","The double helix protects the bases from environmental damage"],correctAnswer:"The complementary base pairing rules (A-T, G-C) ensure accurate matching",explanation:"The complementary base pairing rules create a stable double helix structure and ensure that each strand can serve as an accurate template for DNA replication."},{question:"In the virtual organism lab, you saw how different alleles produce different phenotypes. If a population has alleles R, r, and r' at a flower color gene, how many distinct genotypes are possible?",options:["3 (one for each allele)","6 (RR, Rr, Rr', rr, rr', r'r')","9 (3 alleles × 3 alleles)","It depends on which alleles are dominant"],correctAnswer:"6 (RR, Rr, Rr', rr, rr', r'r')",explanation:"With 3 alleles at a diploid locus, we get n(n+1)/2 = 3(4)/2 = 6 possible genotypes: 3 homozygotes and 3 heterozygotes."},{question:"The lesson showed that genetic variation comes from multiple sources. Why are neutral mutations especially useful for studying population history and relationships?",options:["They are the most common type of mutation in natural populations","They accumulate steadily over time since natural selection doesn't eliminate them","They are easier to detect using modern sequencing technologies","They always result in visible changes that can be easily studied"],correctAnswer:"They accumulate steadily over time since natural selection doesn't eliminate them",explanation:"Neutral mutations are not subject to natural selection, so they accumulate at a roughly constant rate, making them ideal molecular clocks for studying evolutionary history."},{question:"You used the nucleotide diversity calculator to compare different datasets. What would a very low π value (like 0.001) most likely indicate about a population's recent history?",options:["The population has been rapidly expanding in size","The population has experienced high levels of gene flow","The population likely went through a bottleneck or founder event","The population has been under strong diversifying selection"],correctAnswer:"The population likely went through a bottleneck or founder event",explanation:"Low nucleotide diversity typically indicates a recent reduction in effective population size, which reduces genetic variation through genetic drift."}],qf={id:"lesson-1-1",moduleId:"module-1",title:"DNA, Genes, and Variation",estimatedTimeMinutes:25,passingScore:75,nextLessonId:"lesson-1-2",quizQuestions:Xf,pages:[{type:"intro",title:"DNA, Genes, and Variation",subtitle:"Foundations for Population Genetics",content:l.jsx(To,{title:"DNA, Genes, and Variation",subtitle:"Foundations for Population Genetics",description:"Welcome to the foundation of population genetics! In this lesson, we'll explore the molecular basis of heredity and variation that makes evolutionary studies possible. Understanding DNA structure, genes, alleles, and genetic variation is essential for grasping how populations evolve over time. These concepts form the building blocks for more advanced topics like coalescent theory and phylogenetic analysis.",objectives:[{icon:l.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-6 w-6",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:l.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z"})}),text:"Analyze DNA's double helix structure and its role in hereditable information storage"},{icon:l.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-6 w-6",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:l.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 10V3L4 14h7v7l9-11h-7z"})}),text:"Distinguish between genes and alleles and understand their relationship to phenotype"},{icon:l.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-6 w-6",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:l.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9z"})}),text:"Identify sources of genetic variation and calculate nucleotide diversity measures"}],estimatedTime:25,previewElement:l.jsx(Of,{}),studyTip:"Use the scratch pad (bottom right) to take notes as you progress through the lesson. Your notes will be saved automatically!"})},{type:"content",title:"DNA Structure and Function",subtitle:"The Molecular Foundation of Heredity",content:l.jsxs(l.Fragment,{children:[l.jsx(pt,{children:l.jsx("p",{children:"DNA (Deoxyribonucleic Acid) is the universal molecule of heredity, storing genetic information in all living organisms. Understanding its structure is crucial for grasping how genetic information is maintained, replicated, and passed between generations."})}),l.jsx(cn,{caption:"Interactive DNA Structure - Click on different components to explore",children:l.jsx(Bf,{})}),l.jsxs(yt,{columns:2,children:[l.jsx(pt,{title:"Historical Context",children:l.jsxs("div",{className:"space-y-3 text-sm",children:[l.jsxs("div",{className:"bg-sp-pale-green/10 p-3 rounded-lg border-l-4 border-sp-pale-green",children:[l.jsx("p",{className:"font-semibold text-sp-pale-green",children:"1953: Watson & Crick"}),l.jsx("p",{className:"text-sp-white/80",children:"Proposed the double helix model using X-ray crystallography data from Rosalind Franklin."})]}),l.jsxs("div",{className:"bg-sp-pale-green/10 p-3 rounded-lg border-l-4 border-sp-pale-green",children:[l.jsx("p",{className:"font-semibold text-sp-pale-green",children:"Key Insight"}),l.jsx("p",{className:"text-sp-white/80",children:"The complementary base pairing (A-T, G-C) explains both structure stability and replication mechanism."})]})]})}),l.jsx(pt,{title:"DNA's Role in Heredity",children:l.jsxs("ul",{className:"space-y-2 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Information Storage:"})," Genetic instructions encoded in base sequences"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Faithful Replication:"})," Template-based copying ensures accuracy"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Stable Inheritance:"})," Chemical bonds maintain information across generations"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Evolutionary Record:"})," Mutations create variation for natural selection"]})]})})]}),l.jsxs(yt,{columns:4,children:[l.jsx(it,{term:"DNA",children:"Deoxyribonucleic acid - the molecule that carries genetic instructions in living organisms."}),l.jsx(it,{term:"Nucleotide",children:"Building block of DNA consisting of a phosphate group, deoxyribose sugar, and nitrogenous base."}),l.jsx(it,{term:"Base Pair",children:"Complementary nucleotides held together by hydrogen bonds (A-T or G-C)."}),l.jsx(it,{term:"Double Helix",children:"The twisted ladder structure of DNA with two antiparallel strands."})]}),l.jsx(pt,{title:"The Chemistry of Information",children:l.jsx("p",{children:"The sequence of nucleotides along DNA strands encodes genetic information. The strict base-pairing rules (purines A,G pair with pyrimidines T,C respectively) create a redundant system where each strand serves as a template for its complement - the foundation of DNA replication and repair."})})]})},{type:"content",title:"Genes and Alleles",subtitle:"From Genetic Code to Observable Traits",content:l.jsxs(l.Fragment,{children:[l.jsx(pt,{children:l.jsx("p",{children:"Genes and alleles are fundamental concepts that bridge the gap between DNA sequences and the traits we observe in organisms. Understanding their relationship is essential for population genetics."})}),l.jsx(pt,{title:"Key Definitions",children:l.jsxs(yt,{columns:2,children:[l.jsxs("div",{className:"space-y-4",children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Gene"}),l.jsx("p",{className:"text-sm text-sp-white/80",children:"A specific DNA sequence at a particular location (locus) that can be inherited and typically codes for a functional product."})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Allele"}),l.jsx("p",{className:"text-sm text-sp-white/80",children:"Alternative versions of the same gene that arise through mutation and provide variation in populations."})]})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Genotype"}),l.jsx("p",{className:"text-sm text-sp-white/80",children:"The specific combination of alleles an individual carries for a particular gene or set of genes."})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Phenotype"}),l.jsx("p",{className:"text-sm text-sp-white/80",children:"The observable characteristics resulting from the interaction of genotype with the environment."})]})]})]})}),l.jsx(cn,{caption:"Virtual Organism Lab - Select different allele combinations to see phenotype changes",children:l.jsx(zf,{})}),l.jsxs(pt,{title:"The Importance of Allelic Diversity",children:[l.jsx("p",{children:"Genetic diversity within populations provides the raw material for evolution. Different alleles may:"}),l.jsxs("ul",{className:"list-disc pl-5 space-y-2 mt-3",children:[l.jsxs("li",{children:[l.jsx("strong",{children:"Confer different fitness advantages"})," under varying environmental conditions"]}),l.jsxs("li",{children:[l.jsx("strong",{children:"Provide population resilience"})," against diseases or environmental changes"]}),l.jsxs("li",{children:[l.jsx("strong",{children:"Enable adaptation"})," to new ecological niches over time"]}),l.jsxs("li",{children:[l.jsx("strong",{children:"Maintain genetic health"})," by preventing inbreeding depression"]})]}),l.jsx("div",{className:"bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20 mt-4",children:l.jsxs("p",{className:"text-sm text-sp-white/80",children:[l.jsx("strong",{children:"Population Genetics Perspective:"})," We track allele frequencies over time to understand evolutionary processes like selection, drift, and gene flow."]})})]}),l.jsxs(yt,{columns:3,children:[l.jsx(it,{term:"Gene",children:"A hereditable unit of DNA that occupies a specific location on a chromosome."}),l.jsx(it,{term:"Allele",children:"One of two or more alternative forms of a gene that can occupy the same locus."}),l.jsx(it,{term:"Genotype",children:"The genetic constitution of an individual organism."})]}),l.jsxs(yt,{columns:2,children:[l.jsx(it,{term:"Phenotype",children:"The set of observable characteristics of an individual."}),l.jsx(it,{term:"Locus",children:"The specific physical location of a gene or DNA sequence on a chromosome."})]})]})},{type:"content",title:"Genetic Variation",subtitle:"Sources and Significance",content:l.jsxs(l.Fragment,{children:[l.jsxs(pt,{children:[l.jsxs("p",{children:[l.jsx("strong",{children:"Genetic variation"})," describes the differences in DNA sequences among individuals in a population. This variation is the raw material for evolution and provides the foundation for understanding population history and dynamics."]}),l.jsx("p",{children:"Without genetic variation, populations would lack the flexibility to adapt to changing environments, and we would have no way to reconstruct evolutionary relationships. Understanding how variation arises and changes over time is crucial for population genetics."})]}),l.jsx(cn,{caption:"Interactive mutation simulation and genetic diversity tracking across generations",children:l.jsx(Gf,{})}),l.jsx(pt,{title:"How Genetic Variation Shapes Populations",children:l.jsxs(yt,{columns:2,children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Sources of New Variation"}),l.jsxs("ul",{className:"space-y-2 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Mutation:"})," Creates entirely new alleles through DNA replication errors"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Recombination:"})," Shuffles existing alleles into novel combinations during reproduction"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Gene Flow:"})," Introduces alleles from other populations through migration"]})]})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Factors Affecting Diversity"}),l.jsxs("ul",{className:"space-y-2 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Population Size:"})," Smaller populations lose diversity through genetic drift"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Selection:"})," Can increase or decrease variation depending on type"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Bottlenecks:"})," Dramatic reductions in population size reduce diversity"]})]})]})]})}),l.jsxs(yt,{columns:4,children:[l.jsx(it,{term:"Mutation",children:"Random changes in DNA sequence that create new alleles and provide the ultimate source of all genetic variation."}),l.jsx(it,{term:"Recombination",children:"The process during sexual reproduction that creates new combinations of existing alleles."}),l.jsx(it,{term:"Gene Flow",children:"The transfer of alleles between populations through migration and interbreeding."}),l.jsx(it,{term:"Genetic Drift",children:"Random changes in allele frequencies due to sampling effects, especially strong in small populations."})]}),l.jsxs("div",{className:"bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20",children:[l.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[l.jsx("svg",{className:"w-5 h-5 text-sp-pale-green",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:l.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.998-2.386l-.548-.547z"})}),l.jsx("span",{className:"font-semibold text-sp-pale-green",children:"Key Insight"})]}),l.jsx("p",{className:"text-sp-white/80",children:"The balance between processes that create variation (mutation, recombination, gene flow) and those that reduce it (drift, selection) determines the genetic diversity we observe in natural populations."})]})]})},{type:"content",title:"Measuring Genetic Variation",subtitle:"Nucleotide Diversity and Its Applications",content:l.jsxs(l.Fragment,{children:[l.jsxs(pt,{children:[l.jsxs("p",{children:["To quantify genetic variation, population geneticists use several measures. The most fundamental is ",l.jsx("strong",{children:"nucleotide diversity (π)"}),", which measures the average number of nucleotide differences per site between randomly chosen DNA sequences from a population."]}),l.jsx("p",{children:"This simple measure provides powerful insights into population history, demographic events, and evolutionary processes. It serves as a cornerstone for many analyses in evolutionary biology and conservation genetics."})]}),l.jsx(cn,{caption:"Interactive nucleotide diversity calculator with real-world datasets",children:l.jsx(Hf,{})}),l.jsx(pt,{title:"Understanding Nucleotide Diversity",children:l.jsxs(yt,{columns:2,children:[l.jsxs("div",{className:"space-y-4",children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"The Formula"}),l.jsx("div",{className:"bg-gray-800 rounded p-3 font-mono text-center text-sp-white",children:"π = Σ(pairwise differences) / (total comparisons × sequence length)"}),l.jsx("p",{className:"text-sm text-sp-white/80 mt-2",children:"This gives us the probability that two randomly chosen nucleotides at the same position differ between sequences."})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Interpreting Values"}),l.jsxs("ul",{className:"space-y-1 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("span",{className:"text-red-400",children:"π < 0.001:"})," Low diversity (humans, bottlenecked populations)"]}),l.jsxs("li",{children:["• ",l.jsx("span",{className:"text-yellow-400",children:"π ≈ 0.01:"})," Moderate diversity (many plant/animal species)"]}),l.jsxs("li",{children:["• ",l.jsx("span",{className:"text-green-400",children:"π > 0.02:"})," High diversity (some insects, outcrossing plants)"]})]})]})]}),l.jsxs("div",{className:"space-y-4",children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"What Affects π?"}),l.jsxs("ul",{className:"space-y-2 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Effective population size:"})," Larger populations maintain more diversity"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Mutation rate:"})," Higher rates create more variation"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Selection:"})," Can increase or decrease diversity"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Population history:"})," Bottlenecks reduce diversity"]})]})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Applications"}),l.jsxs("ul",{className:"space-y-1 text-sm text-sp-white/80",children:[l.jsx("li",{children:"• Conservation: Assessing population health"}),l.jsx("li",{children:"• Medicine: Understanding disease susceptibility"}),l.jsx("li",{children:"• Agriculture: Evaluating crop genetic resources"}),l.jsx("li",{children:"• Evolution: Detecting selection and demographic changes"})]})]})]})]})}),l.jsxs(yt,{columns:2,children:[l.jsx(it,{term:"Nucleotide Diversity (π)",children:"A measure of genetic diversity that quantifies the average number of nucleotide differences per site between sequences."}),l.jsx(it,{term:"Heterozygosity",children:"The proportion of individuals in a population that are heterozygous (carrying different alleles) at a given locus."})]}),l.jsxs("div",{className:"bg-yellow-100/10 rounded-lg p-4 border border-yellow-300/20",children:[l.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[l.jsx("svg",{className:"w-5 h-5 text-yellow-400",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:l.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"})}),l.jsx("span",{className:"font-semibold text-yellow-400",children:"Simplified Formula"})]}),l.jsx("p",{className:"text-sp-white/80 text-sm",children:`Think of π as: "If I pick two random DNA sequences from my population and compare them base by base, what's the chance that any given position will be different?" This intuitive interpretation helps connect the math to biological meaning.`})]})]})},{type:"content",title:"Allele Frequencies and Population Variation",subtitle:"Quantifying Genetic Diversity in Populations",content:l.jsxs(l.Fragment,{children:[l.jsx(pt,{children:l.jsx("p",{children:"Population genetics begins with quantifying genetic variation within populations. Understanding how to measure and interpret allele frequencies is fundamental to studying evolution, population structure, and the forces that shape genetic diversity over time."})}),l.jsx(pt,{title:"Enhanced Locus and Allele Definitions",children:l.jsxs(yt,{columns:2,children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Precise Terminology"}),l.jsxs("ul",{className:"space-y-2 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Locus:"})," A specific, fixed position on a chromosome"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Allele:"})," Alternative forms of DNA sequence at a particular locus"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Monomorphic:"})," Only one allele exists in the population"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Polymorphic:"})," Multiple alleles exist in the population"]})]})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Allele Classification"}),l.jsxs("ul",{className:"space-y-2 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Major Allele:"})," Most common allele (>50%)"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Minor Allele:"})," Less common alleles (5-50%)"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Ancestral Allele:"})," Older form (compared to outgroup)"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Derived Allele:"})," Newer form arising from mutation"]})]})]})]})}),l.jsx(cn,{caption:"Explore polymorphic vs monomorphic loci and allele classification",children:l.jsx(Wf,{})}),l.jsxs(pt,{title:"Mathematical Foundation of Allele Frequencies",children:[l.jsx("p",{children:"For a diploid autosomal locus with alleles A₁ and A₂, we calculate allele frequencies from genotype counts:"}),l.jsx("div",{className:"bg-gray-800 rounded-lg p-4 my-4",children:l.jsxs("div",{className:"font-mono text-center space-y-2",children:[l.jsx("div",{className:"text-sp-pale-green text-lg",children:"p = (2N₁₁ + N₁₂) / 2N"}),l.jsx("div",{className:"text-sp-white text-sm",children:"where N₁₁, N₁₂, N₂₂ are genotype counts"}),l.jsx("div",{className:"text-sp-white text-sm",children:"and N is total individuals"})]})}),l.jsx("p",{children:"This formula counts each allele once per chromosome, giving us the true population allele frequency."})]}),l.jsx(cn,{caption:"Interactive allele frequency calculator with mathematical formulas",children:l.jsx(Vf,{})}),l.jsxs(pt,{title:"Site Frequency Spectrum: Advanced Diversity Measure",children:[l.jsxs("p",{children:["The ",l.jsx("strong",{children:"Site Frequency Spectrum (SFS)"})," is a powerful tool that describes the distribution of derived allele frequencies across polymorphic sites. It's highly sensitive to demographic history and natural selection, making it invaluable for evolutionary inference."]}),l.jsxs(yt,{columns:2,children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"What the SFS Shows"}),l.jsxs("ul",{className:"space-y-1 text-sm text-sp-white/80",children:[l.jsx("li",{children:"• Count of sites where derived allele appears in k out of n chromosomes"}),l.jsx("li",{children:"• Histogram bins represent different frequency classes"}),l.jsx("li",{children:"• Shape reveals population history and selection"})]})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-2",children:"Evolutionary Signatures"}),l.jsxs("ul",{className:"space-y-1 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Neutral:"})," Declining pattern (1/f slope)"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Expansion:"})," Excess rare variants"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Bottleneck:"})," Flattened spectrum"]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Selection:"})," Distorted frequency classes"]})]})]})]})]}),l.jsx(cn,{caption:"Interactive site frequency spectrum showing demographic and selection signatures",children:l.jsx(jf,{})}),l.jsxs(yt,{columns:4,children:[l.jsx(it,{term:"Monomorphic Locus",children:"A locus where only one allele exists in the population - no genetic variation present."}),l.jsx(it,{term:"Polymorphic Locus",children:"A locus where multiple alleles exist in the population - genetic variation is present."}),l.jsx(it,{term:"Major Allele",children:"The most common allele at a locus, typically with frequency greater than 50%."}),l.jsx(it,{term:"Minor Allele",children:"All alleles except the most common one; usually refers to alleles with frequency 5-50%."})]}),l.jsxs(yt,{columns:3,children:[l.jsx(it,{term:"Ancestral Allele",children:"The older form of an allele, inferred by comparison to outgroup species."}),l.jsx(it,{term:"Derived Allele",children:"The newer form of an allele that arose more recently through mutation."}),l.jsx(it,{term:"Site Frequency Spectrum",children:"Distribution describing frequencies of derived alleles at polymorphic sites in a sample."})]}),l.jsxs("div",{className:"bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20",children:[l.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[l.jsx("svg",{className:"w-5 h-5 text-sp-pale-green",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:l.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.998-2.386l-.548-.547z"})}),l.jsx("span",{className:"font-semibold text-sp-pale-green",children:"Population Genetics Foundation"})]}),l.jsx("p",{className:"text-sp-white/80",children:"These quantitative measures of genetic variation form the mathematical foundation for understanding how populations evolve. Allele frequencies are the basic currency of population genetics, while the SFS provides detailed signatures of evolutionary history."})]})]})},{type:"content",title:"Summary and Connections",subtitle:"Linking Foundations to Population Genetics",content:l.jsxs(l.Fragment,{children:[l.jsxs(pt,{children:[l.jsx("p",{children:"Let's consolidate the key concepts and understand how they connect to broader population genetics topics:"}),l.jsxs(yt,{columns:2,children:[l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-3",children:"Essential Ideas"}),l.jsxs("ul",{className:"space-y-2 text-sm text-sp-white/80",children:[l.jsxs("li",{children:["• ",l.jsx("strong",{children:"DNA's Structure:"})," Ensures high-fidelity inheritance, making it possible to trace genealogical history through its sequence."]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Genes as Loci:"})," Represent heritable units whose different states (alleles) can be tracked through a population."]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Alleles as States:"})," Arise from mutation and provide the variation that population genetic models analyze."]}),l.jsxs("li",{children:["• ",l.jsx("strong",{children:"Genetic Variation as Data:"})," The pattern of allelic differences among individuals is the raw data for inferring the historical processes of evolution."]})]})]}),l.jsxs("div",{children:[l.jsx("h4",{className:"font-semibold text-sp-pale-green mb-3",children:"Connections to Population Genetics"}),l.jsxs("div",{className:"space-y-3",children:[l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded p-3",children:[l.jsx("div",{className:"font-medium text-sp-pale-green",children:"Coalescent Theory"}),l.jsx("div",{className:"text-xs text-sp-white/70",children:"Uses genetic variation to infer common ancestors"})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded p-3",children:[l.jsx("div",{className:"font-medium text-sp-pale-green",children:"Phylogenetics"}),l.jsx("div",{className:"text-xs text-sp-white/70",children:"Reconstructs evolutionary relationships from DNA sequences"})]}),l.jsxs("div",{className:"bg-sp-very-dark-blue/50 rounded p-3",children:[l.jsx("div",{className:"font-medium text-sp-pale-green",children:"Natural Selection"}),l.jsx("div",{className:"text-xs text-sp-white/70",children:"Acts on phenotypic differences arising from genetic variation"})]})]})]})]})]}),l.jsx(cn,{caption:"Test your understanding with immediate feedback",children:l.jsx(kf,{})}),l.jsx(pt,{children:l.jsx("p",{children:"With this foundation, we can now begin to think about how to model the history of genetic variation in populations. The next lessons will explore how these molecular building blocks give rise to the patterns we observe in evolutionary data."})}),l.jsxs("div",{className:"bg-sp-pale-green/10 rounded-lg p-4 border border-sp-pale-green/20",children:[l.jsxs("div",{className:"flex items-center gap-2 mb-2",children:[l.jsx("svg",{className:"w-5 h-5 text-sp-pale-green",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:l.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M13 10V3L4 14h7v7l9-11h-7z"})}),l.jsx("span",{className:"font-semibold text-sp-pale-green",children:"Next Steps"})]}),l.jsx("p",{className:"text-sp-white/80",children:"Ready for the quiz? You'll need 75% or higher to complete this lesson and unlock the next module on population genetics principles."})]})]})},{type:"quiz",title:"Interactive Quiz",subtitle:"Test Your Understanding",content:null},{type:"resources",title:"Additional Resources",subtitle:"Continue Your Learning Journey",content:l.jsx(Ao,{congratsMessage:"Congratulations on completing the fundamentals! Here are curated resources to deepen your understanding and prepare for advanced topics in population genetics.",nextLessonDescription:"You've mastered the molecular foundations! The next lesson will introduce population genetics principles, including Hardy-Weinberg equilibrium and factors that cause evolutionary change. Up Next: Population Genetics Fundamentals - How allele frequencies change over time and what shapes genetic diversity in real populations.",resources:{textbooks:[{title:"Introduction to Population Genetics",author:"Halliburton",description:"Comprehensive introduction to population genetic theory"},{title:"Molecular Evolution",author:"Li & Graur",description:"Advanced treatment of molecular evolutionary processes"},{title:"Coalescent Theory",author:"Wakeley",description:"In-depth coverage of coalescent methods"}],articles:[{title:"The neutral theory of molecular evolution - Kimura (1968)",description:"Foundational paper on neutral evolution"},{title:"Nucleotide diversity in humans - Li & Sadler (1991)",description:"Classic study of human genetic variation"},{title:"Patterns of DNA sequence variation - Kreitman (2000)",description:"Review of sequence variation patterns"}],databases:[{name:"1000 Genomes Project",description:"Human genetic variation data"},{name:"NCBI dbSNP",description:"Single nucleotide polymorphism database"},{name:"Ensembl",description:"Genome browser with variation data"}],software:[{name:"DnaSP",description:"DNA sequence polymorphism analysis"},{name:"Arlequin",description:"Population genetics software"},{name:"MEGA",description:"Molecular evolutionary genetics analysis"}]},practiceExercises:[{icon:"🧬",title:"DNA Analysis",description:"Practice calculating nucleotide diversity using real sequence data from public databases"},{icon:"📊",title:"Data Visualization",description:"Create plots showing genetic diversity patterns across different populations"},{icon:"🔬",title:"Case Studies",description:"Analyze real-world examples of genetic variation in conservation and medicine"}]})}]};function Kf(){return l.jsx(bo,{config:qf})}export{Kf as default};
