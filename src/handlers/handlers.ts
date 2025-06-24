import { GraphQLError, GraphQLID, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { BlogType, CommentType, UserType } from '../schema/schema'
import User from "../models/User";
import Blog from "../models/Blog";
import Comment from "../models/Comment";
import { Date, Document, startSession, Types } from "mongoose";
import { compareSync, hashSync } from 'bcryptjs'

interface UserDocument extends Document {
    name: string;
    email: string;
    password: string;
    blogs: Types.ObjectId[];
    comments: Types.ObjectId[];
}

interface BlogDocument extends Document {
    title: string;
    content: string;
    date: string;
}

const RootQuery = new GraphQLObjectType({
    name: 'RootQuery',
    fields: {
        //get all user
        users: {
            type: new GraphQLList(UserType),
            async resolve(){
                return await User.find();
            }
        },

        blogs: {
            type: new GraphQLList(BlogType),
            async resolve(){
                return await Blog.find();
            }
        },

        comments: {
            type: new GraphQLList(CommentType),
            async resolve(){
                return await Comment.find();
            }
        }
    }
})

const mutations = new GraphQLObjectType({
    name: 'mutation',
    fields: {
        // user Signup''
        signup:{
            type: UserType,
            args: {
                name: { type: new GraphQLNonNull(GraphQLString) },
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(parent, {name, email, password}){
                let existUser: Document<any, any, any>;
                try {
                    existUser = await User.findOne({email})
                    if(existUser) return new Error('User exist')
                    const encryptPass = hashSync(password)
                    const user = new User({ name, email, password: encryptPass })
                    return user.save()
                } catch(err){
                    return new Error('Failed')
                }
            }
        },
        // login user
        login: {
            type: UserType,
            args: {
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(parent, { email, password}){
                // let existUser: undefined
                try {
                    let existUser = await User.findOne({email}) as UserDocument
                    if(!existUser){
                        return new Error(`User Doesn't Exist`)
                    }
                    const decryptPass = compareSync(password, existUser?.password)

                    if(!decryptPass) return new Error('Incorrect Password')

                    return existUser
                } catch(err){
                    return new Error('Failed')
                }
            }            
        },
        // create blog
        addBlog: {
            type: BlogType,
            args: {
                title: { type: new GraphQLNonNull(GraphQLString) },
                content: { type: new GraphQLNonNull(GraphQLString) },
                date: { type: new GraphQLNonNull(GraphQLString) },
                user: { type: new GraphQLNonNull(GraphQLID) }
            },
            async resolve(parent, { title, content, date , user}){
                let blog: Document<any, any, any>;
                const session = await startSession()
                try {
                    session.startTransaction({ session })
                    blog =  new Blog({title, content, date, user})
                    const existUser = await User.findById(user) as UserDocument | null;
                    if(!existUser) return new Error('User not Found')

                    existUser.blogs.push(user)
                    await existUser.save({session})
                    return await blog.save({session})
                } catch(err){
                    return new Error('Failed')
                } finally {
                    await session.commitTransaction();
                }
            }            
        },
        // update blog
        updateBlog: {
            type: BlogType,
            args: {
                title: { type: new GraphQLNonNull(GraphQLString) },
                content: { type: new GraphQLNonNull(GraphQLString) },
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            async resolve(parent, { id, title, content }){
                let exitblog: BlogDocument
                try {
                    exitblog = await Blog.findById(id)

                    if(!exitblog) return new Error('Blog not found')
                    return await Blog.findByIdAndUpdate(id, {
                                  title,
                                  content
                                 },
                                 {
                                    new: true
                                 })
                } catch(err){
                    return new Error('Failed')
                }
            }             
        },
        // delete blog
        deleteBlog: {
            type: BlogType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            async resolve(parent, { id }){
                let exitblog: any
                const session = await startSession()
                try {
                    session.startTransaction({ session })
                    exitblog = await Blog.findById(id).populate("user")

                    const existUser = exitblog?.user;
                    if(!existUser) return new Error('User not linked') 
                    if(!exitblog) return new Error('Blog not found')
                    existUser.blogs.pull(exitblog._id);
                    await existUser.save({ session });

                    //  this needs to work
                    return Blog.findByIdAndDelete(id)
                } catch(err){
                    return new Error(err)
                }  finally {
                    await session.commitTransaction();
                }
            }            
        },   
        
        // add comment to Blog

        addCommentToBlog: {
            type: CommentType,
            args: {
                text: { type: new GraphQLNonNull(GraphQLString) },
                date: { type: new GraphQLNonNull(GraphQLString) },
                blog: { type: new GraphQLNonNull(GraphQLID) },
                user: { type: new GraphQLNonNull(GraphQLID) }
            },
            async resolve(parent, { text, date, blog, user }){
                const session = await startSession()
                let comment: Document<any, any, any>;
                try {
                    session.startTransaction({ session })
                    const existUser = await User.findById(user) as any;
                    const existBlog = await Blog.findById(blog) as any;
                    if(!existBlog || !existUser) return new Error('Something not Found')
                    
                    comment = new Comment({ text, date, blog, user })
                    existUser.comments.push(comment) 
                    existBlog.comments.push(comment)
                    await existUser.save({session})
                    await existBlog.save({session})
                    return await comment.save({session})
                } catch(err){
                    return new Error(err)
                } finally {
                    await session.commitTransaction();
                }
            }
        },

        // delete comment

        deleteComment: {
            type: CommentType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            async resolve(parent, { id }){
                let comment: any
                const session = await startSession()
                try {
                    session.startTransaction({ session })
                    comment = await Comment.findById(id)
                    if(!comment) return new Error('Comment not found')

                    const existUser = await User.findById(comment?.user) as any;
                    if(!existUser) return new Error('User not linked')

                    const existBlog = await Blog.findById(comment?.blog) as any;
                    if(!existBlog) return new Error('Blog not linked')
                    
                    existUser.comments.pull(comment);
                    existBlog.comments.pull(comment);
                    await existUser.save({ session });
                    await existBlog.save({ session });
                    return await Comment.findByIdAndDelete(id)
                } catch(err){
                    return new Error(err)
                } finally {
                    await session.commitTransaction();
                }
            }
        }
    }
})

const appSchema = new GraphQLSchema({query: RootQuery, mutation: mutations})

export default appSchema;