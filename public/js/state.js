// ConnectHub Application State
const State = {
  currentUser: null,
  activeView: 'feed', // 'feed', 'explore', 'profile', 'auth'
  viewParams: {},
  suggestedUsers: [],
  storiesUsers: [],

  listeners: [],

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify() {
    this.listeners.forEach(fn => fn(this));
  },

  setUser(user) {
    this.currentUser = user;
    this.notify();
  },

  setView(view, params = {}) {
    this.activeView = view;
    this.viewParams = params;
    this.notify();
  }
};
