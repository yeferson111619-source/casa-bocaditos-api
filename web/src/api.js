export class ApiError extends Error { constructor(message,status){super(message);this.status=status;} }
export async function request(path,{method='GET',body,signal}={}) {
 let response;
 try {response=await fetch('/api'+path,{method,signal,credentials:'same-origin',cache:'no-store',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});}
 catch(error){if(error.name==='AbortError')throw error;throw new ApiError('No se pudo conectar. Revisa la conexión y que el servidor esté encendido.',0);}
 const data=response.status===204?null:await response.json().catch(()=>null);
 if(!response.ok)throw new ApiError(data?.error?.message||`Error del servidor (${response.status})`,response.status);
 return data?.data;
}
