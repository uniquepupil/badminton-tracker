const BASE=process.env.NEXT_PUBLIC_API_BASE_URL||"http://localhost:4000/api";
export class ApiError extends Error{code:string;constructor(code:string,message:string){super(message);this.code=code;}}
export async function api<T>(path:string,init:RequestInit={}){const response=await fetch(`${BASE}${path}`,{...init,credentials:"include",headers:{"Content-Type":"application/json",...init.headers}});const body=await response.json().catch(()=>null);if(!response.ok)throw new ApiError(body?.error?.code||"REQUEST_FAILED",body?.error?.message||"Request failed.");return body.data as T;}
