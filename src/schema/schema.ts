import { GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import Blog from "../models/Blog";
import Comment from "../models/Comment";
import User from "../models/User";

export const UserType = new GraphQLObjectType({
    name: "UserType",
    fields: ()=>({
        id: { type: new GraphQLNonNull(GraphQLID) },
        name : { type: new GraphQLNonNull(GraphQLString) },
        email : { type: new GraphQLNonNull(GraphQLString) },
        password : { type: new GraphQLNonNull(GraphQLString) },
        blogs: {
            type: new GraphQLList(BlogType),
            async resolve(parent){
                return await Blog.find({user:parent.id})
            }
        },
        comments: {
            type: new GraphQLList(CommentType),
            async resolve(parent){
                return await Comment.find({ user: parent.id })
            }
        }
    })
})

export const BlogType = new GraphQLObjectType({
    name: "BlogType",
    fields: ()=>({
        id: { type: new GraphQLNonNull(GraphQLID) },
        title : { type: new GraphQLNonNull(GraphQLString) },
        content : { type: new GraphQLNonNull(GraphQLString) },
        date : { type: new GraphQLNonNull(GraphQLString) },
        user: {
            type: UserType,
            async resolve(parent){
                return User.findById( parent.user )
            }
        },
        comments: {
            type: new GraphQLList(CommentType),
            async resolve(parent){
                return Comment.find({ blog: parent.id })
            }
        }
    })
})

export const CommentType = new GraphQLObjectType({
    name: "CommentType",
    fields: ()=>({
        id: { type: new GraphQLNonNull(GraphQLID) },
        text : { type: GraphQLString },
        user: {
            type: UserType,
            async resolve(parent){
                return User.findById( parent.user )
            }
        },
        blog: {
            type: BlogType,
            async resolve(parent){
                return Comment.findById(parent.blog)
            }
        }
    })
})