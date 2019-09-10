const axios = require('axios');
const inquirer = require('inquirer');
const { promisify } = require('util');
const { downloadDirectory } =require('./constants');
const fs = require('fs');
const ncp = require('ncp');
const path = require('path')
const Metalsmith = require('metalsmith'); //遍历文件夹 找需不需要渲染
//统一所有模板引擎
const { waitFnLoading, download } = require('./tools')

let { render } = require('consolidate').ejs;
render = promisify(render);



//获取项目列表
const fetchRepoList = async () => {
    const { data } = await axios.get('https://api.github.com/users/a549573735/repos')
    return data;
};

//抓取tag列表
const fetchTagList = async (repo) => {
    const { data } = await axios.get(`https://api.github.com/repos/a549573735/${repo}/tags`)
    return data;
}


//封装loading 

module.exports = async (projectName) => {
    let result;
    let repos = await waitFnLoading(fetchRepoList, 'fetching template ....')();
    repos = repos.map(repo => repo.name);
    //获取之前显示loading
    //选择模板 inquirer
    let { repo } = await inquirer.prompt({
        name: 'repo', //获取选择后的结果
        type: "list",
        message: 'please choice a template to create project',
        choices: repos
    });

    let tags = await waitFnLoading(fetchTagList, 'fetching tags ....')(repo);

    if(!fs.existsSync(`${downloadDirectory}/${repo}`)){
        if (tags.length> 0) {
            tags = tags.map(tag => tag.name);
            let { tag } = await inquirer.prompt({
                name: 'tag', //获取选择后的结果
                type: "list",
                message: 'please choice tags to create project',
                choices: tags
            });
            result = await waitFnLoading(download, "download template...")(repo, tag)
        }else {
            result = await waitFnLoading(download, "download template...")(repo)
        }
    }else {
         result=`${downloadDirectory}/${repo}`;
    }
        
    //下载模板
  
    // 拿到了下载的目录 直接拷贝到当前执行目录即可

    // 查看项目中是否存在 aks 文件 
    if (!fs.existsSync(path.join(result, 'ask.js'))) {
        //如果没有就直接下载拷贝
        await waitFnLoading(ncp, 'copy template to current directory')(result, path.resolve(projectName));
    } else {
        // 复杂的需要渲染模板 渲染后在拷贝
        // 把git 上的项目下载下来 ， 如果有ask 文件就是一个复杂的项目 需要用户选择后编译出来
        // metalsmith 只要模板引擎编译 都需要
        console.log('复杂模板')

        //1 让用户填写信息
        //2 用户填写信息去渲染模板
        //如果你传了路径 他会默认遍历当前路径src 下的文件
        await new Promise((resolve, reject) => {
            Metalsmith(__dirname)
                .source(result)
                .destination(path.resolve(projectName))
                .use(async (files, metal, done) => {
                   const args = require(path.join(result,'ask.js'))
                   let res= await inquirer.prompt(args)
                   let meta=metal.metadata()
                   Object.assign(meta,res);
                   delete files['ask.js'];
                   done();
                })
                .use((files,metal,done)=>{
                    let res=metal.metadata();
                    Reflect.ownKeys(files).forEach(async (file)=>{
                         if(file.includes('.js')||file.includes('.json')){
                             let content= files[file].contents.toString();
                             if(content.includes('<%')){
                                 content= await  render(content,res);
                                 files[file].contents=Buffer.from(content);
                             }
                         }   
                    }) 
                    //根据用户的输入下载模板;
                   done()
                })
                .build((err) => {
                    if (err) reject(err);
                    resolve();
                })
        })


    }
}

