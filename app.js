
$(document).on("ajaxSend", (a,b,c) => {
    b.setRequestHeader("Authorization", "Bearer "+localStorage.getItem("auth-token") );
});
// const apiUrl = (location.origin.search("localhost")>0)?'http://localhost:8787':'https://share.thespj.workers.dev';
const apiUrl = 'https://share.thespj.workers.dev';

const Authorize = Backbone.View.extend({
    el: "#auth",
    events: {
        "click .login-btn": "openLogin",
        "click .register-btn": "openRegister",
        "click .password-reset-btn": "openPasswordReset",
        "click .send-code-btn": "sendCode",
        "submit .login-form": "login",
        "submit .register-form": "register",
        "submit .password-reset-form": "resetPassword"
    },
    isLoggedIn: function() {
        return ( localStorage.getItem("auth-token") && localStorage.getItem("auth-token").length > 14 );
    },
    openLogin: function( e ) {
        e.preventDefault();
        this.render();
    },
    openRegister: function( e ) {
        e.preventDefault();
        this.$el.find('.box').hide();
        this.$el.find('.register-box').show();
    },
    openPasswordReset: function( e ) {
        e.preventDefault();
        this.$el.find('.box').hide();
        this.$el.find('.password-reset-box').show();
    },
    sendCode: function( ev ) {
        ev.preventDefault();
        const self = this;
        let email = self.$el.find( '.password-reset-box [name=email]' ).val();
        console.log( email );
        ev.currentTarget.innerHTML = 'Sending code'
        fetch( apiUrl+"/auth/send-code", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email })
        }).then( r => r.json() ).then( res => {
            ev.currentTarget.remove();
            console.log( res );
            let d = new Dialog("Mail sent");
            d.setContent(`<p class='w3-container'>Please check your email.</p>`);
            d.render();
        });
    },
    resetPassword: function( ev ) {
        ev.preventDefault();
        const self = this;
        let obj = {};
        self.el.querySelectorAll( '.password-reset-box input' ).forEach( i => {
            obj[i.getAttribute('name')] = i.value;
        });
        console.log( obj );
        $(ev.currentTarget.querySelector('.update-password-btn')).prepend( `<i class="fa fa-refresh w3-spin"></i> ` );
        fetch( apiUrl+"/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify( obj )
        }).then( r => r.json() ).then( res => {
            $(ev.currentTarget.querySelector('.update-password-btn .fa')).remove();
            let d = new Dialog("Message");
            d.setContent(`<p class='w3-container w3-padding-16'>${res.message}</p>`);
            d.render();
            console.log( res );
        });        
    },
    login: function( ev ) {
        ev.preventDefault();
        const self = this;
        const email = this.$el.find(".login-box [name=email]").val().trim();
        const password = this.$el.find(".login-box [name=password]").val().trim();
        $(ev.currentTarget.querySelector('.submit-btn')).prepend( `<i class="fa fa-refresh w3-spin"></i> ` );
        fetch( apiUrl+"/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        }).then( r => r.json() ).then( res => {
            $(ev.currentTarget.querySelector('.submit-btn .fa')).remove();
            console.log( res )
            if( res.jwt ) {
                localStorage.setItem("auth-token", res.jwt );
                setTimeout( () => {
                    console.log( "Routing to homepage" )
                    router.navigate("/profiles");
                }, 1000)
            } else {
                self.$el.find(".login-box .alert").removeClass("w3-hide").find("div").html(res.message);
                setTimeout(()=>{
                    self.$el.find(".login-box .alert").addClass("w3-hide").find("div").html(res.message);
                }, 10000);
            }
        });
    },
    register: function( ev ) {
        ev.preventDefault();
        const self = this;
        const email = this.$el.find(".register-box [name=email]").val().trim();
        const password = this.$el.find(".register-box [name=password]").val().trim();
        $(ev.currentTarget.querySelector('.submit-btn')).prepend( `<i class="fa fa-refresh w3-spin"></i> ` );
        fetch( apiUrl+"/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, password: password })
        }).then( r=>r.json() ).then( res => {
            console.log( res )
            $(ev.currentTarget.querySelector('.submit-btn .fa')).remove();
            if( res.jwt ) {
                localStorage.setItem("auth-token", res.jwt );
                setTimeout( () => {
                    router.navigate("/");
                }, 1000)
            }
            self.$el.find(".register-box .alert").removeClass("w3-hide w3-red").find("div").html(res.message);
            setTimeout(()=>{
                self.$el.find(".register-box .alert").addClass("w3-hide w3-red").find("div").html(res.message);
            }, 10000);
        });
    },
    render: function () {
        console.log( "rendering auth view");
        $(".view").hide();
        this.$el.show();
        this.$el.find('.box').hide();
        this.$el.find('.login-box').show();
    }
});
const Spinner = Backbone.View.extend({
    initialize: function() {
        this.el = document.querySelector('div#spinner.view');
    },
    render: function() {
        $(".view").hide();
        this.el.style.display = 'flex';
    },
    show: function() {
        this.render();
    }
});
const ProfileChooserCardView = Backbone.View.extend({
    tagName: 'li',
    className: 'w3-bar',
    template: _.template(`<div class='pr_<%= id %>'>
        <img src="<%= info.image %>" class='w3-circle w3-bar-item' alt="Avatar of <%= info.name %>" />
        <span class='w3-bar-item'>
            <span class='w3-large'><%= info.name %></span><br>
            <span class='w3-tiny'><%= info.about %></span><br>
            <a href="/profile/<%=id%>" data-navigo class='w3-card w3-theme w3-round-xxlarge w3-button'><i class="fa fa-pencil"></i> Edit</a>
            <a data-id='<%=id%>' class='w3-round-xxlarge w3-button delete-profile'><i class="fa fa-trash"></i> Delete</a>
        </span>  
    </div>`),
    events: {
        'click .delete-profile': 'remove'
    },
    initialize: function( model ) {
        this.model = model;
        this.model.on('remove', () => this.removeCard() );
        this.$el.append( this.template( this.model.toJSON() ) );
        return this;
    },
    render: function() {
        return this.el;
    },
    removeCard: function() {
        this.$el.remove();
    },
    remove: function( ev ) {
        ev.preventDefault();
        this.$el.css('filter', 'blur(12px)')
        console.log( this.model.get('id') );
        let prompt = confirm(`Are you sure to delete this profile? Name: ${this.model.get('info').name}`);
        if( prompt ) {
            this.model.destroy({ wait: true });
        }
    }
});
const ProfileChooserView = Backbone.View.extend({
    el: "#profile-chooser",
    model: new (Backbone.Collection.extend({
        url: function() {
            let a = `${apiUrl}/api/profile`;
            if( this.get('id') )
                a += '/'+this.get('id');
            return a;
        }
    }))(),
    template: _.template(`<li class='w3-bar pr_<%= id %>'>
        <img src="<%= info.image %>" class='w3-circle w3-bar-item' alt="Avatar of <%= info.name %>" />
        <span class='w3-bar-item'>
            <span class='w3-large'><%= info.name %></span><br>
            <span class='w3-tiny'><%= info.about %></span><br>
            <a href="/profile/<%=id%>" data-navigo class='w3-card w3-theme w3-round-xxlarge w3-button'><i class="fa fa-pencil"></i> Edit</a>
            <a data-id='<%=id%>' class='w3-round-xxlarge w3-button delete-profile'><i class="fa fa-trash"></i> Delete</a>
        </span>  
    </li>`),
    initialize: function() {
        const self = this;
        this.model.on('add', this.show, this);
        this.model.on('reset', this.reset, this);
    },
    render: function() {
        const self = this;
        $('.view').hide();
        this.$el.show();
        this.model.reset();
        this.model.fetch({
            success: function() {
                router.updatePageLinks();
            },
            error: function() {
                self.$el.find('.loader').remove();
                self.$el.find('#profile-list').html( `<li class='w3-large'>No profile to show. Create a new profile.</li>` );
            }
        });
    },
    reset: function( a ) {
        this.$el.find("#profile-list").empty();
        this.$el.find("#profile-list").append( `<li class='loader w3-center'>
            <div class='w3-xxlarge'><i class='fa fa-spin fa-refresh'></i></div>
        </li>` );
    },
    show: function( m ) {
        let pCard = new ProfileChooserCardView( m );
        this.$el.find("#profile-list").append( pCard.render() );
        try { this.$el.find("#profile-list .loader").remove(); } catch (error) {}
    }
});
const Header = Backbone.View.extend({
    el: "#header",
    events: {
        "click .logout-btn": "logout"
    },
    logout: function() {
        localStorage.clear();
        router.navigate("/");
    },
    render: function( hide ) {
        if ( hide )
            this.$el.hide();
        else
            this.$el.show();
    }
});

// Add Single Social Button to a collection
const AddSocialBtnView = Backbone.View.extend({
    tagName: 'div',
    className: 'w3-modal',
    socialMediaIcons: [ 'behance', 'delicious', 'dribbble', 'facebook-square', 'flickr', 'foursquare', 'github', 'google', 'linkedin', 'medium', 'paypal', 'pinterest', 'qq', 'quora', 'reddit', 'slack', 'slideshare', 'snapchat', 'instagram', 'soundcloud', 'spotify', 'telegram', 'trello', 'tumblr', 'twitch', 'twitter', 'vimeo', 'vk', 'wechat', 'weibo', 'whatsapp', 'youtube'],
    template: `<div class="w3-modal-content w3-animate-zoom">
        <div class="w3-large w3-container w3-padding-16 w3-theme">Add Social Button</div>
        <div class="w3-container w3-padding-16">
            <form action="#">
                <label>Link type</label>
                <select name="type" class="w3-select w3-border w3-round-xxlarge"></select>
                <div class="w3-section"></div>
                <label>URL</label>
                <input type="url" name="url" class="w3-input w3-border w3-round-xxlarge" />
                <div class="w3-section"></div>
                <button class="w3-button w3-right w3-round-xxlarge w3-theme submit-btn">Add</button>
                <button class="w3-button w3-left w3-round-xxlarge cancel-btn">Cancel</button>
            </form>    
        </div>
    </div>`,
    events: {
        'submit form': 'add',
        'click .cancel-btn': 'close'
    },
    initialize: function( collection ) {
        this.collection = collection;
        this.$el.html( this.template );
        this.socialMediaIcons = this.socialMediaIcons.sort();
        this.socialMediaIcons.forEach(e => {
            this.$el.find('[name=type]').append(`<option value="${e}">${e}</option>`)
        });
        this.$el.find('[name=type]').append(`<option value="share-alt">other</option>`);
        document.querySelector('body').append( this.el );
        return this;
    },
    add: function( ev ) {
        ev.preventDefault();
        let newBtn = {};
        newBtn.type = ev.currentTarget.querySelector('[name=type]').value.split("-")[0];
        newBtn.icon = ev.currentTarget.querySelector('[name=type]').value;
        newBtn.url = ev.currentTarget.querySelector('[name=url]').value;
        newBtn.index = Math.max( ...this.collection.toJSON().map( a => a.index ) ) + 1;
        if ( newBtn.index == -Infinity )
            newBtn.index = 1;
        this.collection.add( newBtn );
        console.log( newBtn, this.collection );
        this.close( ev );
    },
    close: function( ev ) {
        ev.preventDefault();
        this.$el.remove();
    },
    render: function() {
        this.$el.show();
        return this.el;
    }
});
// Single Social Button from a collection
const SocialBtnView = Backbone.View.extend({
    tagName: 'span',
    className: 'w3-display-container btn-container',
    template: _.template(`<span>
        <a target="_blank" href="<%= url %>" class="w3-xlarge w3-circle w3-button w3-theme">
            <i class="fa fa-<%= icon %>"></i>
        </a>
        <button style="padding:0 6px;" data-index="<%= index %>" class='w3-card remove w3-button w3-white w3-display-topleft w3-circle'>&times;</button>
    </span>`),
    events: {
        'click .remove': 'remove'
    },
    initialize: function({ model, collection, isEditable }) {
        this.model = model;
        this.collection = collection;

        this.el.classList.add(`social-btn-${this.model.get('index')}`);
        let card = this.template( this.model.toJSON() );
        this.$el.append( card );
        if( !isEditable )
            this.$el.find('.remove').remove();
        return this;
    },
    remove: function( ev ) {
        ev.preventDefault();
        this.$el.remove();
        this.collection.remove( this.model );
    },
    render: function() {
        return this.el;
    }
});
// Collection of Social Buttons
const SocialBtnsView = Backbone.View.extend({
    tagName: 'div',
    className: 'btn-wrapper',
    template: `<div class="btns"></div><button class="w3-xlarge w3-circle w3-button w3-theme add"><i class="fa fa-plus"></i></button>`,
    events: {
        "click .add": "openAddModal"
    },
    model: Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: 'index'
        }),
        comparator:'index'
    }),
    initialize: function({ collection, isEditable }) {
        this.$el.html( this.template );
        const self = this;
        const Btns = Backbone.Collection.extend({
            model: Backbone.Model.extend({
                idAttribute: 'index'
            })
        });
        collection = collection.sort( (a,b)=> a.index - b.index );
        this.collection = new Btns();
        this.collection.on('add', m => { self.addBtn({ model: m, isEditable: isEditable }) });
        this.collection.on('reset', () => { self.$el.find('.btns').empty(); });
        this.collection.add( collection );
        ( isEditable )?this.$el.find('.add').show():this.$el.find('.add').hide()
    },
    addBtn: function({ model, isEditable }) {
        let btnCard = new SocialBtnView({
            model: model,
            collection: this.collection,
            isEditable: isEditable
        });
        this.$el.find('.btns').append( btnCard.render() );
    },
    render: function() {
        return this.el;
    },
    openAddModal: function( ev ) {
        ev.preventDefault();
        const newBtn = new AddSocialBtnView( this.collection );
        newBtn.render();
    }
});

// Add Single Social Button to a collection
const AddContactBtnView = Backbone.View.extend({
    tagName: 'div',
    className: 'w3-modal',
    icons: [
        { value: 'phone', name: 'Phone'},
        { value: 'whatsapp', name: 'WhatsApp'},
        { value: 'telegram', name: 'Telegram'},
        { value: 'map-marker', name: 'Address'},
        { value: 'link', name: 'Website'},
        { value: 'envelope', name: 'Email'},
        { value: 'link', name: 'Other'}
    ],
    template: `<div class="w3-modal-content w3-animate-zoom">
        <div class="w3-large w3-container w3-padding-16 w3-theme">Add Contact Button</div>
        <div class="w3-container w3-padding-16">
            <form action="#">
                <label>Type</label>
                <select name="type" class="w3-select w3-border w3-round-xxlarge"></select>
                <div class="w3-section"></div>
                <label>Value</label>
                <input type="text" name="value" class="w3-input w3-border w3-round-xxlarge" />
                <div class="w3-section"></div>
                <button class="w3-button w3-right w3-round-xxlarge w3-theme submit-btn">Add</button>
                <button class="w3-button w3-left w3-round-xxlarge cancel-btn">Cancel</button>
            </form>    
        </div>
    </div>`,
    events: {
        'submit form': 'add',
        'click .cancel-btn': 'close'
    },
    initialize: function( collection ) {
        this.collection = collection;
        this.$el.html( this.template );
        this.icons.forEach(e => {
            this.$el.find('[name=type]').append(`<option value="${e.value}">${e.name}</option>`)
        });
        document.querySelector('body').append( this.el );
        return this;
    },
    add: function( ev ) {
        ev.preventDefault();
        let newBtn = {};
        newBtn.icon = ev.currentTarget.querySelector('[name=type]').value;
        newBtn.value = ev.currentTarget.querySelector('[name=value]').value;
        newBtn.type = newBtn.icon;
        newBtn.index = Math.max( ...this.collection.toJSON().map( a => a.index ) ) + 1;
        if ( newBtn.index == -Infinity )
            newBtn.index = 1;
        this.collection.add( newBtn );
        this.close( ev );
    },
    close: function( ev ) {
        ev.preventDefault();
        this.$el.remove();
    },
    render: function() {
        this.$el.show();
        return this.el;
    }
});
// Single Contact Button from a collection
const ContactBtnView = Backbone.View.extend({
    tagName: 'span',
    className: 'w3-display-container btn-container',
    template: _.template(`
        <a target="_blank" href="<%= url %>" class="w3-bar-item w3-button w3-block w3-padding-16">
            <i class="fa fa-<%= icon %>"></i>
            <%= value %>
        </a>
        <button data-index="<%= index %>" class='w3-card remove w3-button w3-theme w3-display-right w3-margin-right w3-circle'>
            <i class="fa fa-close"></i>
        </button>
    `),
    events: {
        'click .remove': 'remove'
    },
    initialize: function({ model, collection, isEditable }) {
        if ( model.get('type') == 'envelope' ) model.set('url', `mailto:${model.get('value')}`);
        else if ( model.get('type') == 'phone' ) model.set('url', `tel:${model.get('value')}`);
        else if ( model.get('type') == 'whatsapp' ) model.set('url', `https://wa.me/${model.get('value')}`)
        else if ( model.get('type') == 'telegram' ) model.set('url', `https://t.me/${model.get('value')}`)
        else if ( model.get('type') == 'link' ) {model.set('url', model.get('value')); }
        else model.set('url', null);

        this.model = model;
        this.collection = collection;

        this.el.classList.add(`contact-btn-${this.model.get('index')}`);
        let card = this.template( this.model.toJSON() );
        this.$el.append( card );
        if( !isEditable )
            this.$el.find('.remove').remove();
        return this;
    },
    remove: function( ev ) {
        ev.preventDefault();
        this.$el.remove();
        this.collection.remove( this.model );
    },
    render: function() {
        return this.el;
    }
});
// Collection of Contact Buttons
const ContactBtnsView = Backbone.View.extend({
    tagName: "div",
    template: `<div class="btns"></div>
        <div class='w3-center w3-margin-bottom w3-margin-top'>
            <button class="w3-button w3-round-xxlarge w3-theme add"><i class="fa fa-plus"></i> Add new contact</button>
        </div>`,
    events: {
        "click .add": "add"
    },
    model: Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: 'index'
        })
    }),
    initialize: function({ collection, isEditable }) {
        this.$el.html( this.template );
        const self = this;
        const Btns = Backbone.Collection.extend({
            model: Backbone.Model.extend({
                idAttribute: 'index'
            })
        });
        collection = collection.sort( (a,b)=> a.index - b.index );
        this.collection = new Btns();
        this.collection.on('add', m => { self.addBtn({ model: m, isEditable: isEditable }) });
        this.collection.on('reset', () => { self.$el.find('.btns').empty(); });
        this.collection.add( collection );
        ( isEditable )?this.$el.find('.add').show():this.$el.find('.add').hide()
    },
    render: function() {
        return this.el;
    },
    addBtn: function({ model, isEditable }) {
        let card = new ContactBtnView({
            model: model,
            collection: this.collection,
            isEditable: isEditable
        });
        this.$el.find('.btns').append( card.render() );
    },
    add: function( ev ) {
        ev.preventDefault();
        const addView = new AddContactBtnView( this.collection );
        addView.render();
    }
});
const LinkBtnView = Backbone.View.extend({
    el: "#profile .link-btns",
    template: _.template(`<span class='link-btn-<%=index%> w3-display-container btn-container'>
        <a target="_blank" href="<%= url %>" class="w3-bar-item w3-button w3-block w3-padding-16">
            <i class="fa fa-link"></i> <%= title %>
        </a>
        <button data-index="<%= index %>" class='w3-card remove w3-button w3-theme w3-display-right w3-margin-right w3-round-xxlarge'>&times;</button>
    </span>`),
    events: {
        'click .remove': 'remove',
        "click .add": "openAddModal",
        "submit .add-link form": "add",
        "click .add-link .cancel-btn": "closeAddModal"
    },
    model: Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: 'index'
        })
    }),
    initialize: function() {
        const self = this;
        this.model = new this.model();
        this.model.on('add', m => { self.showLink( m ) });
        this.model.on('reset', () => { self.$el.find('.btns').empty(); });
        this.model.on('remove', m => {
            self.$el.find(`.link-btn-${m.get('index')}`).remove();
        });
    },
    render: function() {
        this.$el.find('.btns').empty();
    },
    showLink: function( el ) {        
        this.$el.find('.btns').append( this.template( el.toJSON() ) );
    },
    remove: function( ev ) {
        ev.preventDefault();
        let index = ev.currentTarget.dataset.index;
        this.model.remove( index );
    },
    add: function( ev ) {
        ev.preventDefault();
        console.log( "Adding" )
        let newBtn = {};
        newBtn.title = ev.currentTarget.querySelector('[name=title]').value;
        newBtn.url = ev.currentTarget.querySelector('[name=url]').value;
        newBtn.index = Math.max( ...this.model.toJSON().map( a => a.index ) ) + 1;
        if ( newBtn.index == -Infinity )
            newBtn.index = 1;
        this.model.add( newBtn );
        console.log( this.model.toJSON() );
        this.$el.find('.add-link').hide();
    },
    openAddModal: function( ev ) {
        ev.preventDefault();
        this.$el.find('.add-link').show();
    },
    closeAddModal: function( ev ) {
        ev.preventDefault();
        this.$el.find('.add-link').hide();
    }
});

const ProfileView = Backbone.View.extend({
    el: "#profile",
    model: new (Backbone.Model.extend({
        url: function() {
            let a = `${apiUrl}/api/profile`;
            if( this.get( "id" ) )
                a += "/"+this.get( "id" );
            return a;
        }
    }))(),
    events: {
        'change #profile-theme':'updateTheme',
        "click .open-photo-editor": "openPhotoEditor",
        "click .close-photo-editor": "closePhotoEditor",
        "change .photo-editor .image": "loadPhotoToCanvas",
        "click .save": "save",
        "click .remove-mapping": "removeMapping",
        "click .photo-editor .crop": "crop",
        "click .configure": "openConfigurationModal",
        "click #qr-scan-modal .cancel": "closeConfigurationModal",
        "click .delete-profile": "openConfirmDeletion",
        "click .deletion-confirmed": "deletionConfirmed",
        "click .deletion-cancelled": "deletionCancelled"
    },
    render: function() {
        const self = this;
        $('.view').hide();
        this.$el.show();
        this.$el.find('#profile-theme').val('https://www.w3schools.com/lib/w3-theme-teal.css');

        try {
            this.socials.model.reset();
            this.contacts.model.reset();
            this.links.model.reset();            
        } catch (error) {}

        if ( this.model.get('id') ==  0  ) {
            this.model.unset('id');
            this.model.set({
                info: {
                    name: "Name",
                    about: "Working at somewhere",
                    image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver",
                    cover: 'https://i.pravatar.cc/300'
                },
                contacts: [],
                socials: [],
                links: [],
                theme: 'https://www.w3schools.com/lib/w3-theme-teal.css'
            });
            self.renderInfo();
            console.log( 'Need to create a new profile' );
            return;
        }

        this.model.fetch({
            success: function() {
                self.renderInfo()
            }
        });
    },
    renderInfo: function() {
        this.$el.find(".image-card .avatar").attr( "src", this.model.get("info").image );
        this.$el.find(".image-card .avatar").attr( "alt", this.model.get("info").name );
        this.$el.find(".basic-info .name").val( this.model.get("info").name );
        this.$el.find(".basic-info .about").val( this.model.get("info").about );
        this.$el.find("#profile-theme").val( this.model.get("theme") ).change();
        if( !this.socials ) {
            this.socials = new SocialBtnsView({ collection: this.model.get("socials"), isEditable: true });
            this.$el.find(".social-btns").html( this.socials.render() );
        }
        if( !this.contacts ) {
            this.contacts = new ContactBtnsView({ collection: this.model.get("contacts"), isEditable: true });
            this.$el.find(".contact-btns").html( this.contacts.render() );
        }
        if( !this.links )
            this.links = new LinkBtnView( this.model.get("links") );

        this.links.model.add( this.model.get("links").sort( (a,b) => a.index - b.index ) );

        return this;
    },
    openPhotoEditor: function( ev ) {
        ev.preventDefault();
        this.$el.find(".photo-editor").show();
    },
    closePhotoEditor: function( ev ) {
        ev.preventDefault();
        this.$el.find(".photo-editor").hide();
    },
    loadPhotoToCanvas: function( ev ) {
        ev.preventDefault();
        const self = this;
        let f = ev.currentTarget.files[0];
        self.$el.find(".alert p").text("Loading photo");
        let fileReader = new FileReader();
        fileReader.readAsDataURL( f );
        fileReader.onload = () => {
            self.$el.find(".alert p").text("Crop photo");
            self.$el.find("#input-image").attr('src', fileReader.result);
            if ( self.cropper ) {
                self.cropper.destroy()
            }
            self.cropper = new Cropper( self.$el.find("#input-image")[0], {
                aspectRatio: 1,
                viewMode: 1
            });
        }
    },
    crop: function( ev ) {
        ev.preventDefault();
        const self = this;
        if( self.cropper ) {
            let res = self.cropper.getCroppedCanvas().toDataURL("image/webp");
            res = res.slice( res.indexOf(",")+1, res.length )
            self.$el.find(".alert").removeClass("w3-hide");
            self.$el.find(".alert p").text("Uploading photo");
            let form = new FormData();
            form.append("image", res);
            form.append("key", "64b0a819e5099280c5c0f7241b8c790a");
            fetch( "https://api.imgbb.com/1/upload", {
                method: "POST",
                body: form
            }).then( r => r.json() ).then( r => {
                self.closePhotoEditor( ev );
                self.$el.find(".alert").addClass("w3-hide");
                self.$el.find(".image-card img").attr("src", r.data.url );
                self.$el.find(".image-card img").attr("alt", r.data.title );
                self.$el.find(".alert p").text("");
            });
        }
    },
    openConfirmDeletion: function( ev ) {
        ev.preventDefault();
        this.$el.find('#confirm-deletion').show();
    },
    deletionConfirmed: function( ev ) {
        ev.preventDefault();
        const self = this;
        $(ev.currentTarget).prepend(`<i class='fa fa-refresh fa-spin'></i> `);
        this.model.destroy({
            success: function() {
                $(ev.currentTarget).find(".fa").remove();
                router.navigate("/");
            },
            error: function() {
                $(ev.currentTarget).find(".fa").remove();
                let d = new Dialog("Error");
                d.setContent( `<p class='w3-container w3-padding-16>Counldn't delete.</p>` );
                d.render();
            }
        });
    },
    deletionCancelled: function( ev ) {
        ev.preventDefault();
        this.$el.find('#confirm-deletion').hide();
    },
    updateTheme: function( ev ) {
        ev.preventDefault();
        let themeUrl = ev.currentTarget.value;
        let themeLink = document.querySelector('#link-rel');
        themeLink.setAttribute('href', themeUrl );
    },
    save: function( ev ) {
        ev.preventDefault();
        const self = this;

        let basicInfo = this.model.get("info");
        basicInfo.image = self.$el.find(".image-card img").attr("src");
        basicInfo.name = this.$el.find('.basic-info .name').val().trim();
        basicInfo.about = this.$el.find('.basic-info .about').val().trim();
        let newObj = {
            info: basicInfo,
            contacts: this.contacts.model.toJSON(),
            socials: this.socials.collection.toJSON(),
            links: this.links.model.toJSON(),
            theme: self.$el.find("#profile-theme").val()
        };
        $(ev.currentTarget).prepend(`<i class='fa fa-refresh fa-spin'></i> `);
        this.model.save(newObj,{
            success: function() {
                $(ev.currentTarget).find('.fa').remove();
                self.model.fetch();
                router.navigate("/");
            },
            error: function() {
                $(ev.currentTarget).find('.fa').remove();
            },
            wait:true
        });
    },
    closeConfigurationModal: function( ev ) {
        ev.preventDefault();
        try {
            this.$el.find("#qr-scan-modal").hide();
            this.qrScanner.stop();
        } catch (e) {}
    },
    openConfigurationModal: function( ev ) {
        ev.preventDefault();
        const self = this;
        this.$el.find("#qr-scan-modal").show();
        self.$el.find("#qr-scan-modal .alert").html("").hide();
        let config = {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        };
        if ( !this.qrScanner ) {
            this.qrScanner = new Html5Qrcode( "reader" );
        }
        this.qrScanner.start({ facingMode: "environment" }, config, ( decodedText, decodedResult ) => {
            self.qrScanner.stop();
            let urlStart = 'https://share.c2l.asia/#';
            if ( !decodedText.startsWith( urlStart ) ) {
                self.$el.find("#qr-scan-modal .alert").text( `Invalid QR code. QR does not belong to Share by C2L: ${decodedText}` ).show();
                return;
            }
            decodedText = decodedText.slice( urlStart.length )
            console.log( decodedText );
            const Mapping = Backbone.Model.extend({
                url: function() {
                    return apiUrl+"/api/map";
                }
            });
            m = new Mapping();
            m.set('code', decodedText)
            m.save({ profile: self.model.get('id') },{
                wait:true,
                success: function() {
                    self.$el.find("#qr-scan-modal .alert").empty();
                    self.closeConfigurationModal( ev );
                }, error: function( jq, res) {
                    self.$el.find("#qr-scan-modal .alert").html( `${res.responseJSON.message} <span class='w3-text-theme w3-large'>${decodedText}</span>` ).show();
                }
            });
            self.$el.find("#qr-scan-modal .alert").text( `Mapping your profile with code: ${decodedText}` );
            console.log( decodedText );
            console.log( decodedResult );
        });
        this.getMappings();
    },
    removeMapping: function( ev ) {
        ev.preventDefault();
        let model = this.mappings.get(ev.currentTarget.dataset.id);
        model.destroy({ wait:true });
    },
    getMappings: function() {
        const self = this;
        const mappingTemplate = _.template(`<li class='w3-bar mp_<%= id %>'>
        <span class='w3-bar-item'><%= code %></span>
        <button data-id='<%= id %>' class='w3-bar-item w3-right remove-mapping w3-button w3-circle w3-xlarge'><i class='fa fa-trash'></i></button>
        </li>`);
        self.$el.find('#mappings').empty();

        if( !this.mappings ) {
            this.mappings = new (Backbone.Collection.extend({ url: `${apiUrl}/api/map` }))();
            this.mappings.on('add', function( addedModel ) {
                console.log( addedModel.get('profile') == self.model.get('id') )
                if ( addedModel.get('profile') == self.model.get('id') )
                    self.$el.find('#mappings').append( mappingTemplate( addedModel.toJSON() ) );
            });
            this.mappings.on('reset', function() {
                self.$el.find('#mappings').empty();
            });
            this.mappings.on('remove', function( m ) {
                self.$el.find(`.mp_${m.get('id')}`).remove();
            });
        }
        this.mappings.reset();
        this.mappings.fetch({
            error: function( jq, res ) {
                self.$el.find('#mappings').html( `<li>${res.responseJSON}</li>` );
            }
        });
    }
});

const PublicProfileView = Backbone.View.extend({
    el: "#public-profile",
    socialTemplte: _.template(`<a target="_blank" href="<%= url %>" class="w3-xlarge w3-card w3-circle w3-button w3-theme"><i class="fa fa-<%= icon %>"></i></a>`),
    contactTemplate: _.template(`<a target="_blank" href="<%= url %>" class="w3-bar-item w3-button w3-block w3-padding-16"><i class="fa fa-<%= icon %>"></i> <%= value %></a>`),
    linkTemplate: _.template(`<a target="_blank" href="<%= url %>" class="w3-bar-item w3-button w3-block w3-padding-16"><i class="fa fa-link"></i> <%= title %></a>`),
    model: new (Backbone.Model.extend({
        url: function() {
            let a = `${apiUrl}/map`;
            if( this.get( "code" ) )
                a += "/"+this.get( "code" );
            return a;
        }
    }))(),
    events: {
        "click .share-btn": "share"
    },
    render: function() {
        const self = this;
        $('.view').hide();
        this.$el.show();
        header.$el.hide();

        this.model.fetch({
            success: function() {
                self.renderInfo()
            },
            error: function() {                
                let d = new Dialog();
                d.setContent( `<div class='w3-bar w3-theme'><span class='w3-bar-item'>Error</span></div>
                <p class='w3-container w3-padding-16'>Oh oh! Could not find user.</p>`);
                d.render()
                setTimeout(() => {
                    d.remove();
                    router.navigate('/');
                }, 20000);
            }
        });
    },
    renderInfo: function() {
        this.$el.find(".image-card .avatar").attr( "src", this.model.get("info").image );
        this.$el.find(".image-card .avatar").attr( "alt", this.model.get("info").name );
        this.$el.find(".basic-info .name").text( this.model.get("info").name );
        this.$el.find(".basic-info .about").html( this.model.get("info").about );
        document.querySelector('#link-rel').setAttribute('href', this.model.get("theme") );
        this.downloadContactCard();

        this.$el.find('.btns').empty();
        this.renderSocialMedia().renderContacts().renderLinks();

        document.querySelector('title').innerText = `${this.model.get('info').name} || ${this.model.get('info').about}`;
        document.querySelector('meta[name=description]').getAttribute('content', this.model.get('info').about);

        return this;
    },
    renderSocialMedia: function() {
        const self = this;
        if( this.model.get('socials').length > 0 )
            this.$el.find('#social').show();
        else
            this.$el.find('#social').hide();
        this.model.get('socials').sort((a,b) => a.index - b.index).forEach( s => {
            self.$el.find('.social-btns .btns').append( self.socialTemplte( s ) );
        });
        return this;
    },
    renderContacts: function() {
        const self = this;
        if( this.model.get('contacts').length > 0 )
            this.$el.find('#contact').show();
        else
            this.$el.find('#contact').hide();
        this.model.get('contacts').sort( (a,b) => a.index - b.index ).forEach( s => {
            self.$el.find('.contact-btns .btns').append( self.contactTemplate( s ) );
        });
        return this;
    },
    renderLinks: function() {
        const self = this;
        if( this.model.get('links').length > 0 ) {
            this.$el.find('#link').show();
        } else {
            this.$el.find('#link').hide();
        }
        this.model.get('links').sort( (a, b) => a.index - b.index ).forEach( s => {
            self.$el.find('.link-btns .btns').append( self.linkTemplate( s ) );
        });
        return this;
    },
    downloadContactCard: function() {
        const self = this;
        const VCF = {
            getName: () => {
                return `FN:${self.model.get('info').name}\n`
            },
            getTitle: () => {
                return `TITLE:${self.model.get('info').about}\n`
            },
            getPhone: () => {
                let a = "";
                self.model.get('contacts').forEach( r => {
                    if( r.type =='phone' )
                        a += `TEL;TYPE=home:${r.value}\n`
                });
                return a;
            },
            getEmail: () => {
                let a = "";
                self.model.get('contacts').forEach( r => {
                    if( r.type =='envelope' )
                        a += `EMAIL;TYPE=home:${r.value}\n`
                });
                return a;
            },
            getWebsite: () => {
                let a = "";
                self.model.get('contacts').forEach( r => {
                    if( r.type =='link' )
                        a += `URL;TYPE=work:${r.value}\n`
                });
                self.model.get('links').forEach( r => {
                    a += `URL;TYPE=work:${r.url}\n`
                });
                return a;
            }
        }
        let template = "BEGIN:VCARD\n";
        template += "VERSION:4.0\n";
        template += VCF.getName()
        template += VCF.getTitle()
        template += VCF.getPhone()
        template += VCF.getEmail()
        template += VCF.getWebsite()
        template += "END:VCARD";

        self.$el.find('.download-btn').attr( 'download', btoa(self.model.get('info').name)+".vcf" );
        let url = URL.createObjectURL( new Blob( [template], {type:'text/vcard'} ) );
        self.$el.find('.download-btn').attr( 'href', url );
    },
    share: function( ev ) {
        ev.preventDefault();
        const self = this;
        navigator.share({
            url: location.href,
            title: `${self.model.get('info').name} - ${self.model.get('info').about}`
        });

    }
});
const Dialog = Backbone.View.extend({
    tagName: "div",
    className: "w3-modal w3-show",
    events: {
        'click .close': 'remove'
    },
    initialize: function( header ) {
        this.$el.append(`<div class='w3-modal-content w3-animate-zoom'></div>`);
        if ( header ) {
            this.$el.find(".w3-modal-content").append(`<div class='w3-modal--header w3-bar w3-theme'>
                <span class='w3-bar-item'>${header}</span>
                <button class='close w3-bar-item w3-button w3-theme-d1 w3-right'>&times;</button>
            </div>`);
        }
        this.$el.find(".w3-modal-content").append(`<div class='w3-modal--content'></div>`);
        this.$el.find(".w3-modal-content").append(`<div class='w3-modal--footer'></div>`);
    },
    render: function() {
        this.$el.show();
        document.querySelector("body").append( this.el );
        return this.el;
    },
    remove: function() {
        this.el.remove();
    },
    setContent: function( content ) {
        this.$el.find('.w3-modal--content').append( content );
    }
});

const loader = new Spinner();
var profileChooser = null; 
const header = new Header();
var profileView = null;
var publicProfileView = null;

const Util = {
    authView: null,
    profilesView: null,
    profileView: null,
    header: null,
    publicProfileView: null,
    getAuth: function() {
        if ( !this.authView )
            this.authView = new Authorize();
        return this.authView;
    },
    getHeader: function() {
        if ( !this.header )
            this.header = new Header();
        return this.header;
    },
    getProfiles: function() {
        if ( !this.profilesView )
            this.profilesView = new ProfileChooserView();
        return this.profilesView;
    },
    getProfile: function() {
        if ( !this.profileView )
            this.profileView = new ProfileView();
        return this.profileView;
    },
    getPublicProfile: function() {
        if ( !this.publicProfileView )
            this.publicProfileView = new PublicProfileView();
        return this.publicProfileView;
    }
}

loader.render();

const router = new Navigo("/");
router.hooks({
    before( done, match ) {
        if( Util.getAuth().isLoggedIn() ) {
            Util.getHeader().render();
            done();
        } else {
            Util.getHeader().render( true );
            if( match.route.name == "" || match.route.name == "auth" || match.route.name == ":profile" ) {
                done();
            } else {
                Util.getAuth().render();
                done( false );
            }
        }
        if ( match.hashString.length > 3 ) {
            router.navigate( `/${match.hashString}` );
        }
        return;
    }
});
router.on("", (match) => {
    router.navigate( `/profiles` );
});
router.on("/auth", () => Util.getAuth().render() );
router.on("/profiles", () => Util.getProfiles().render() );
router.on("/profile/:id", ({ data }) => {
    Util.getProfile().model.set('id', data.id);
    Util.getProfile().render();
});
router.on("/:profile", ({ data,params }) => {
    Util.getPublicProfile().model.set('code', data.profile);
    Util.getPublicProfile().render();
});
router.resolve();


