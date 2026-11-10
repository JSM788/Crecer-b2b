import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { closeSchema, scheduleSchema, evidenceSchema } from './modules/field-operations/visits/dto/visit.dto';
import { credentialsSchema } from './modules/identity/dto/login.dto';

const id = z.uuid();
const timestamp = z.iso.datetime({offset:true});
const day = z.object({id, company_id:id, membership_id:id, business_date:z.iso.date(), status:z.enum(['active','completed']), started_at:timestamp, ended_at:timestamp.nullable()});
const visit = z.object({id, company_id:id, membership_id:id, customer_id:id, scheduled_at:timestamp, workday_id:id.nullable(), status:z.enum(['pending','active','completed']), arrived_at:timestamp.nullable(), ended_at:timestamp.nullable(), result:z.enum(['attended','closed','unavailable']).nullable(), observations:z.string().nullable()});
const me = z.object({companyId:id,membershipId:id,userId:id,role:z.enum(['commercial','merchandiser']),email:z.email(),timeZone:z.string()});
const empty = z.object({}).strict();
export const routes = [
  {method:'get',path:'/health',schema:z.object({status:z.literal('ok')}),public:true},
  {method:'post',path:'/auth/login',input:credentialsSchema,schema:z.object({token:z.string(),expiresAt:timestamp}),public:true},
  {method:'post',path:'/auth/logout',input:empty,schema:z.object({loggedOut:z.boolean()})},
  {method:'get',path:'/me',schema:me},
  {method:'get',path:'/me/customers',schema:z.array(z.object({id,name:z.string(),address:z.string()}))},
  {method:'get',path:'/me/agenda',schema:z.array(visit.extend({customer_name:z.string(),customer_address:z.string(),has_evidence:z.boolean()}))},
  {method:'get',path:'/me/workday',schema:day.nullable()},
  {method:'get',path:'/me/workdays',schema:z.array(day)},
  {method:'post',path:'/me/workdays/start',input:empty,schema:day,key:true},
  {method:'post',path:'/me/workdays/end',input:empty,schema:day,key:true},
  {method:'post',path:'/me/visits/{id}/check-in',input:empty,schema:visit,key:true},
  {method:'post',path:'/me/visits/{id}/close',input:closeSchema,schema:visit,key:true},
  {method:'post',path:'/me/visits',input:scheduleSchema,schema:visit,key:true},
  {method:'get',path:'/me/visits/{id}/evidence',schema:evidenceSchema.nullable()},
] as const;
export function contract() {
  const error = {description:'Request rejected. Stable machine code; no data changed for rejected field transitions.',content:{'application/json':{schema:{type:'object',required:['code','message','requestId'],properties:{code:{type:'string'},message:{type:'string'},requestId:{type:'string'},details:{type:'array',items:{type:'object'}}}}}}};
  const paths: Record<string,any> = {};
  for (const route of routes) {
    const parameters: any[] = [];
    if (route.path !== '/health') parameters.push({name:'X-Tenant-Host',in:'header',required:true,description:'Exact lowercase company hostname. The web BFF derives this from its request URL; this is a tenant selector, never proof of authorization.',schema:{type:'string',maxLength:253}});
    if (route.path.includes('{id}')) parameters.push({name:'id',in:'path',required:true,schema:{type:'string',format:'uuid'}});
    if ('key' in route) parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:1,maxLength:128,pattern:'^[A-Za-z0-9_.:-]+$'}});
    paths['/v1'+route.path] = {...paths['/v1'+route.path], [route.method]:{
      operationId:route.method+'_'+route.path.replace(/[^a-z0-9]/gi,'_'),
      security:'public' in route ? [] : [{bearerAuth:[]}], parameters,
      ...('input' in route ? {requestBody:{required:true,content:{'application/json':{schema:z.toJSONSchema(route.input,{io:'input'})}}}} : {}),
      responses:{'200':{description:'Success',content:{'application/json':{schema:z.toJSONSchema(route.schema)}}},'400':error,'401':error,'403':error,'404':error,'409':error,'413':error,'500':error},
    }};
  }
  return {openapi:'3.1.0',info:{title:'Field Operations API',version:'0.1.0',description:'Multi-company basic field operations with self-planning and bounded optional visit images. No sales, payment or offline acceptance endpoints. Lists capped at 200 records.'},paths,components:{securitySchemes:{bearerAuth:{type:'http',scheme:'bearer'}}}};
}
if (require.main === module) void writeFile(resolve(__dirname,'../../contracts/openapi.json'),JSON.stringify(contract(),null,2)+'\n');
