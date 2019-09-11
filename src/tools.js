const { downloadDirectory } =require('./constants');
const ora =require('ora');
const { promisify } = require('util');
let downloadGitRepo = require('download-git-repo');
downloadGitRepo = promisify(downloadGitRepo);

//封装loading 
const waitFnLoading= (fn,message)=> async (...args)=>{
    let spinner =ora(message);
    spinner.start();
    let result=await fn(...args);
    spinner.succeed();
    return result;
}

//分装下载
const download=async (repo,tag)=>{
    let api=`a549573735/${repo}`;
    if(tag){
        api+=`#${tag}`;
    }
    let dest=`${downloadDirectory}/${repo}`;
    await downloadGitRepo(api,dest);
    return dest;
}



module.exports={
    waitFnLoading,
    download
}