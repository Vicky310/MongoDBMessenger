import React, { Component } from 'react';
import avatar from '../images/avatar.png';
import classNames from 'classnames';
import { OrderedMap } from 'immutable'
import _ from 'lodash'
import { ObjectID } from '../helpers/objectid'
import SearchUser from './search-user';
import moment from 'moment';
import UserBar from './user-bar.js';

class Messenger extends Component {
    constructor(props) {
        super(props);

        this.state = {
            height: window.innerHeight,
            newMessage: 'Hello There...',
            searchUser: "",
            showSearchUser: false,

        }
        this._onResize = this._onResize.bind(this);

        this.handleSend = this.handleSend.bind(this);
        this.renderMessage = this.renderMessage.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
        this._onCreateChannel = this._onCreateChannel.bind(this);
        this.renderChannelTitle = this.renderChannelTitle.bind(this);
    }

    renderChannelTitle(channel=null) {
        if(!channel){
            return null;
        }
        const {store} = this.props;  
        const members=store.getMembersFromChannel(channel);
        const names = [];
        members.forEach((user) => {
            const name = _.get(user,'name');
            names.push(name);
        });
        console.log(names);
        let title = _.join(names, ',');

        if(!title && _.get(channel, 'isNew')){
            title = 'New message';
        }
        return <h2>{title}</h2>
    }

    _onCreateChannel() {
        const {store} = this.props;
        const currentUser = store.getCurrentUser();
        const currentUserId = _.get(currentUser, '_id');
        const channelId = new ObjectID().toString();
        const channel = {
            _id: channelId,
            title: "",
            lastMessage: "",
            members: new OrderedMap(),
            messages: new OrderedMap(),
            isNew: true,
            userid: currentUserId,
            created: new Date()
        };
        channel.members = channel.members.set(currentUserId, true);
        // console.log(channel);
        store.onCreateNewChannel(channel);
    }

    scrollToBottom() {
        if (this.messageRef) {
            this.messageRef.scrollTop = this.messageRef.scrollHeight;
        }
    }

    renderMessage(message) {
        const text = _.get(message, 'body', '');

        const html = _.split(text, '\n').map((m, key) => {
            return <p key={key} dangerouslySetInnerHTML={{ __html: m }} ></p>
        })
        return html;
    }
    handleSend() {

        const { newMessage } = this.state;
        const { store } = this.props;
        console.log(newMessage.length);
        //create new message
        if (_.trim(newMessage).length) {
            const messageId = new ObjectID().toString();
            const channel = store.getActiveChannel();
            const channelId = _.get(channel, '_id', null);
            const currentUser = store.getCurrentUser();
            const message = {

                _id: messageId,
                body: newMessage,
                channelId: channelId,
                userId: _.get(currentUser, '_id'),
                me: true,

            }

            store.addMessage(messageId, message);
            this.setState({
                newMessage: '',
            })
        }

    }

    _onResize() {
        this.setState({
            height: window.innerHeight
        });
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }



    componentDidMount() {
        console.log("Component Did Mount");
        window.addEventListener('resize', this._onResize);

    }



  
    componentWillUnmount() {
        window.removeEventListener('resize', this._onResize)


    }
    render() {

        const { store } = this.props;
        const { height } = this.state
        const style = {
            height: height,
        };

        const activeChannel = store.getActiveChannel();
        const messages = store.getMessageFromChannel(activeChannel);//store.getMessages();
        const channels = store.getChannels();
        const members = store.getMembersFromChannel(activeChannel);



        return (

            <div className="app-messenger" style={style}>

                <div className="header">
                    <div className="left">
                        <button className="left-action"><i className="icon-cog" /></button>
                        <button onClick={this._onCreateChannel} className="right-action"><i className="icon-pencil-square-o" /></button>
                        <h2>Messenger</h2>
                    </div>
                    <div className="content">
                        {_.get(activeChannel, 'isNew') ?  <div className="toolbar">
                            <label>To:</label>
                            {
                                members.map((user, key) =>{
                                    return <span onClick={() =>{
                                        store.removeMemberFromChannel(activeChannel, user);
                                    }} key={key}>{_.get(user, 'name')}</span>
                                })
                            }
                            <input placeholder="Type name of person..." onChange={(event) => {
                               
                                const searchUserText = _.get(event, 'target.value');
                                this.setState({
                                    searchUser: searchUserText,
                                    showSearchUser:true,
                                },()=> {
                                    store.startSearchUsers(searchUserText);
                                });

                            }
                        }
                                type="text" value={this.state.searchUser} />
                        {this.state.showSearchUser?<SearchUser
                        onSelect={(user) => {
                            
                            this.setState({
                                showSearchUser:false,
                                searchUser:'',
                            },() => {

                                const userId= _.get(user,'_id');

                                const channelId = _.get(activeChannel,'_id');
                                store.addUserToChannel(channelId,userId);
                            });
                        }}
                         store={store}/>:null}
                             
                    </div> : this.renderChannelTitle(activeChannel) }

                    </div>
                    <div className="right">
                        <UserBar store={store}/>
                    </div>

                </div>
                <div className="main">

                    <div className="sidebar-left">
                        <div className="chanels">
                            {channels.map((channel, key) => {

                                return (
                                    <div onClick={(key) => {

                                        store.setActiveChannelId(channel._id);

                                    }} key={channel._id} className={classNames('chanel', { 'active': _.get(activeChannel, '_id') === _.get(channel, '_id', null) })}>

                                        <div className="user-image">
                                            <img src={avatar} alt="" />
                                        </div>
                                        <div className="chanel-info">
                                            {this.renderChannelTitle(channel)}
                                            <p>{channel.lastMessage}</p>
                                        </div>
                                    </div>
                                )
                            })}

                        </div>
                    </div>
                    <div className="content">

                        <div ref={(ref) => this.messageRef = ref} className="messages">

                            {messages.map((message, index) => {
                                const user = _.get(message,'user');

                                return (
                                    <div key={index} className={classNames('message', { 'me': message.me })}>
                                        <div className="message-user-image">
                                            <img src={_.get(user,'avatar')} alt="" />
                                        </div>
                                        <div className="message-body">
                                            <div className="message-author">{message.me ? 'You ' : _.get('user','name')} says:</div>

                                            <div className="message-text">
                                                {this.renderMessage(message)}
                                            </div>

                                        </div>
                                    </div>

                                );
                            })}


                        </div>

                        {activeChannel && members.size > 0?<div className="messenger-input">

                            <div className="text-input">
                                <textarea onKeyUp={(event) => {

                                    if (event.key === 'Enter' && !event.shiftKey) {
                                        this.handleSend();
                                    }


                                }} onChange={(event) => {
                                    this.setState({ newMessage: _.get(event, 'target.value') })

                                }} value={this.state.newMessage} placeholder="Write your message" />
                            </div>
                            <div className="actions">

                                <button onClick={this.handleSend} className="send">Send</button>
                            </div>
                        </div>:null }


                    </div>

                    <div className="sidebar-right">
                        {members.size >0 ?<div> <h2 className="title">Members</h2>

                        <div className="members">
                            {members.map((member, key) => {

                                return (
                                    <div key={key} className="member">
                                        <div className="user-image">
                                            <img src={_.get(member,'avatar')} alt="" />
                                        </div>
                                        <div className="member-info">
                                            <h2>{member.name}</h2>
                                            <p>Joined: {moment(member.created).fromNow()}</p>
                                        </div>
                                    </div>
                                )
                            })}



                        </div> </div>:null}
                    </div>

                </div>

            </div>
        );
    }
}

export default Messenger;