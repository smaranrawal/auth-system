import bcrypt from 'bcrypt.js'


const encryptPassword=async()=>{
    const salt =await bcrypt.genSalt(10);
    const hashedPassword=await bcrypt.hash(password,salt);
    return hashedPassword;
}

export {encryptPassword};