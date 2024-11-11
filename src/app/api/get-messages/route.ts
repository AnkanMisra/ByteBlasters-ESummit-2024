import { getServerSession } from "next-auth";
import { AuthOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/model/user";
import {User} from "next-auth";
import mongoose from "mongoose";
export async function GET(request: Request){
    await dbConnect();
    const session = await getServerSession(AuthOptions)
    const user : User  = session?.user as User;
    if(!session || !session.user){
        return Response.json({
            success : false,
            message : "Not Authenticated"
        },{status: 401})    
    } 
    // consr userId = user._id; It will surely throw an error as it is a string and not a mongoose object
    const userId = new mongoose.Types.ObjectId(user._id);
    try {
        const user = await UserModel.aggregate([
             {$match : {_id: userId}},
             {$unwind : "$messages"},
             {$sort : {"messages.createdAt" : -1}},
             {$group:{_id : "$_id", messages : {$push : "$messages"}}},   
        ])
        if(!user || user.length === 0){
            return Response.json({
                success : false,
                message : "User not found"
            },{status:404})
        }
        return Response.json({
            success : true,
            messages : user[0].messages
        },{status:200})
    } catch (error) {
        return Response.json({
            success : false,
            message : "Something went wrong in getting messages"
        })
    }
}