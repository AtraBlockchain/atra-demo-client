import React, { Component } from "react";
import { LiteElementHeader } from './index';
import { connect } from "react-redux";
import { GetWeb3Instance } from '../Eth';
import { Button, FormGroup, FormControl, ControlLabel  } from 'react-bootstrap';
import {Loading} from '../../../../components/Loaders';
import LiteUIMethods from "../../methods";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPaperPlane, faHeart } from '@fortawesome/free-solid-svg-icons'
import { FormatDateTime } from '../../../../helpers/Date';
import ProfileHover from 'profile-hover';

const Chat = ({
  mode,
  source,
  posts,
  handleSubmitChat,
  loadingChat
}) => {

  if(loadingChat){
    return (
      <div className='chat-content-container'>
        <Loading />
      </div>
    )
  }else{
    return (
      <div className='chat-content-container'>

        <div id='chat_box_content' className='messages-container'>
          {posts.map((post, i)=>{
            return <div className='message' key={i}>
              <div className='user-info'>
                <div className='profile-name'>
                  <ProfileHover orientation='top' showName={true} address={post.message.address} />
                  <div className='timestamp'>{post.timestring}</div>
                </div>
              </div>
              <div>{post.message.message}</div>
            </div>;
          })}
        </div>
        <form onSubmit={handleSubmitChat} className='submit-container'>
          <FormControl type="search" autocomplete="off" placeholder={'Type your message...'} id='chat_input' />
          <Button type='submit'><FontAwesomeIcon icon={faPaperPlane} /></Button>
        </form>
      </div>
    )
  }

}

class LiteChat extends Component {

  constructor(props){
    super(props);
    this._mounted = false;
    this.state = {
      acccont: '',
      posts: [],
      loadingChat: true,
      pending: ''
    }
    this.connectTo3Box();
  }

  async componentDidMount() {
    this._mounted = true;
  };

  async componentWillUnmount() {
    this._mounted = false;
  }

  connectTo3Box = async () => {
    const web3React = GetWeb3Instance(
      this.props.liteui.liteWallet,
      window.ethereum
    );

    let account = '';

    if(this.props.liteui.liteWallet.enabled && !this.props.liteui.liteWallet.disabled){
      account = this.props.liteui.liteWallet.address;
    }else{
      const res = await web3React.eth.getAccounts();
      account = res[0];
    }

    this.setState({ account })

    window.Box.openBox(account,  web3React.currentProvider, {}).then(box => {
      box.onSyncDone((res)=>{
        this.setupSpaces();
      });
      window.box = box
      this.setupSpaces();
    });
  }

  setupSpaces = async () => {
    const spaceName = 'test-dapp';
    if(!window.box.spaces[spaceName]){
      this.createNewSpace(spaceName);
    }
  }

  createNewSpace = async (spaceName) => {
    const space = await window.box.openSpace(spaceName);
    if(this.props.mode === 'public'){
      this.joinThread(spaceName, this.props.element.config.address);
    }else{
      this.createThread(spaceName, this.props.element.id);
    }
  }

  joinThread = async (spaceName, address) => {

    window.box.spaces[spaceName].joinThreadByAddress(address).then(thread => {

      window.currentThread = thread
      thread.onUpdate(() => {
        this.buildChatLog();
      })
      this.buildChatLog();
    }).catch((err)=>{
      console.log(err);
    })
  }

  createThread = async (spaceName, threadName) => {
    window.box.spaces[spaceName].joinThread(threadName).then(thread => {
      this.props.updateLiteChatThreadId({
        elementId: this.props.element.id,
        address: thread._address
      })
      window.currentThread = thread
      thread.onUpdate(() => {
        this.buildChatLog();
      })
      this.buildChatLog();
    }).catch((err)=>{
      console.log(err);
    })
  }

  buildChatLog = async () => {
    window.currentThread.getPosts().then(posts => {
      let profilePromises = [];

      posts.map((post)=>{
        profilePromises.push(
          new Promise((resolve, reject)=>{
            let message = '';
            try {
              message = JSON.parse(post.message);
            }catch(err){

            }
            window.Box.getProfile(post.author).then(profile => {
              resolve({
                ...post,
                message,
                ...profile,
                timestring: FormatDateTime(post.timestamp * 1000)
              })
            })
          })
        );
      })


      Promise.all(profilePromises).then((posts)=>{
        console.log(posts);
        this.setState({ posts, loadingChat: false });
        var objDiv = document.getElementById("chat_box_content");
        objDiv.scrollTop = objDiv.scrollHeight;
      })

    });
  }

  handleSubmitChat = async (event) => {
    event.preventDefault();
    const value = document.getElementById('chat_input').value;
    if(value.length){
      const message = {
        message: value,
        address: this.state.account
      }
      await window.currentThread.post(JSON.stringify(message));
      document.getElementById('chat_input').value = '';
    }
  }

  render() {

    const element = this.props.element;

    return (
      <div className="lite-chat-container liteui-element">
        <LiteElementHeader
          dragHandleProps={this.props.dragHandleProps}
          mode={this.props.mode}
          edit={()=>this.props.edit(this.props.element.id)}
          remove={()=>this.props.remove(this.props.element.id)}
          title={'Chat'}
          />
        <Chat
          mode={this.props.mode}
          source={element.source}
          posts={this.state.posts}
          handleSubmitChat={this.handleSubmitChat}
          loadingChat={this.state.loadingChat}
        />
      </div>
    );

  }
}

const mapStateToProps = state => {
  return {
    liteui: state.liteui,
    notifications: state.notifications,
    metamask: state.metamask,
    account: state.account,
    auth: state.auth
  };
};

const mapDispatchToProps = dispatch => {
  return {
    ...LiteUIMethods({dispatch})
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LiteChat);
