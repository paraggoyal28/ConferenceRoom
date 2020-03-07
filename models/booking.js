var mongoose=require("mongoose");

var bookSchema = new mongoose.Schema({
   name:String,
   email:String,
   contact:String,
   room:String,
   date:String,
   pantry: String,
   stime:String,
   etime:String,
   ndate:Number,
   nstime:Number,
   netime:Number,
   ispantry:Boolean,
   user_id:mongoose.Schema.Types.ObjectId,
   pantry_id:mongoose.Schema.Types.ObjectId,
});


module.exports=mongoose.model("booking",bookSchema);
