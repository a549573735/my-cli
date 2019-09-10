const program =require('commander');
const { version } =require('./constants')
const path=require('path');

const mapActions={
    create:{
        alias:'c',
        description:'create a project',
        examples:[
            'my-cli create <project-name>'
        ]
    },
    config:{
        alias:'conf',
        description:"config project variable",
        examples:[
            'my-cli config set <k> <v>',
            'my-cli config get <k>'
        ],
    },
    "*":{
        alias:'',
        description:"command not found",
        examples:[]
    }
}

Reflect.ownKeys(mapActions).forEach( (action)=>{
    program.command(action) //配置命令名字
    .alias(mapActions[action].alias)// 命令 别名
    .description(mapActions[action].description) //命令的描述
    .action(()=>{
        if(action==='*'){
           console.log(mapActions[action].description) 
        }else {
           require(path.resolve(__dirname,action))(...process.argv.slice(3));
        }
    });
})

program.on('--help',()=>{
    console.log('\nExamples:');
    Reflect.ownKeys(mapActions).forEach((action)=>{
        mapActions[action].examples.forEach(example=>{
            console.log(`  ${example}`)
        })
    })
});



program.version(version).parse(process.argv);


