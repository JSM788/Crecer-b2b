export function log(level:'info'|'error',event:string,fields:Record<string,unknown>={}) {
  const record=JSON.stringify({time:new Date().toISOString(),level,event,...fields});
  (level==='error' ? process.stderr : process.stdout).write(record+'\n');
}
export function errorMetadata(error:unknown) {
  if (!(error instanceof Error)) return {errorType:'non_error_exception'};
  const code='code' in error && typeof error.code==='string' && /^[A-Za-z0-9_]{1,40}$/.test(error.code) ? error.code : undefined;
  // Raw database/validation error messages can contain credentials or submitted data.
  return {errorType:error.name,errorCode:code};
}
