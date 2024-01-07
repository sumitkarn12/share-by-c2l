
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
        "submit .login-form": "login",
        "submit .register-form": "register"
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
                    route.navigate("/", {trigger: true});
                    header.initialize();
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
                    route.navigate("/", {trigger: true});
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
    events: {
        'click .delete-profile': 'deleteProfile'
    },
    template: _.template(`<li class='w3-bar pr_<%= id %>'>
        <img src="<%= info.image %>" class='w3-circle w3-bar-item' alt="Avatar of <%= info.name %>" />
        <span class='w3-bar-item'>
            <span class='w3-large'><%= info.name %></span><br>
            <span class='w3-tiny'><%= info.about %></span><br>
            <a href="#profile/<%=id%>" class='w3-card w3-theme w3-round-xxlarge w3-button'><i class="fa fa-pencil"></i> Edit</a>
            <a data-id='<%=id%>' class='w3-round-xxlarge w3-button delete-profile'><i class="fa fa-trash"></i> Delete</a>
        </span>  
    </li>`),
    initialize: function() {
        const self = this;
        this.model.on('add', this.show, this);
        this.model.on('reset', this.reset, this);
        this.model.on('remove', this.remove, this);
    },
    render: function() {
        const self = this;
        if ( localStorage.getItem("auth-token") == null ) {
            route.navigate( "auth", { trigger:true });
            throw new Error("Not Authenticated");
        }
        $('.view').hide();
        this.$el.show();
        this.model.reset();
        this.model.fetch({
            error: function() {
                self.$el.find('.loader').remove();
                self.$el.find('#profile-list').html( `<li class='w3-large'>No profile to show. Create a new profile.</li>` );
            }
        });
    },
    reset: function( a ) {
        console.log( `Resetting profile chooser: ${a.toJSON()}` );
        this.$el.find("#profile-list").empty();
        this.$el.find("#profile-list").append( `<li class='loader w3-center'>
            <div class='w3-xxlarge'><i class='fa fa-spin fa-refresh'></i></div>
        </li>` );
    },
    remove: function(m) {
        this.$el.find(`.pr_${m.get('id')}`).remove();
    },
    deleteProfile: function( ev ) {
        ev.preventDefault();
        let profile = this.model.get( ev.currentTarget.dataset.id );
        let prompt = confirm(`Are you sure to delete this profile? Name: ${profile.get('info').name}`);
        if( prompt ) {
            profile.destroy({ wait: true });
        }
    },
    show: function( m ) {
        let temp = this.template( m.toJSON() );
        this.$el.find("#profile-list").append( temp );
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
        location.href = "/";
    },
    initialize: function() {
        this.$el.show();
        if ( localStorage.getItem("auth-token") ){
            this.$el.find(".logout-btn").show();
        } else {
            this.$el.find(".logout-btn").hide();
        }
    }
});

const SocialBtnView = Backbone.View.extend({
    el: "#profile .social-btns",
    socialMediaIcons: [ 'behance', 'delicious', 'dribbble', 'facebook-square', 'flickr', 'foursquare', 'github', 'google', 'linkedin', 'medium', 'paypal', 'pinterest', 'qq', 'quora', 'reddit', 'slack', 'slideshare', 'snapchat', 'instagram', 'soundcloud', 'spotify', 'telegram', 'trello', 'tumblr', 'twitch', 'twitter', 'vimeo', 'vk', 'wechat', 'weibo', 'whatsapp', 'youtube'],
    template: _.template(`<span class='social-btn-<%=index%> w3-display-container btn-container'>
        <a target="_blank" href="<%= url %>" class="w3-xlarge w3-circle w3-button w3-theme">
            <i class="fa fa-<%= icon %>"></i>
        </a>
        <button style="padding:0 6px;" data-index="<%= index %>" class='w3-card remove w3-button w3-white w3-display-topleft w3-circle'>&times;</button>
    </span>`),
    events: {
        'click .remove': 'remove',
        "click .add": "openAddModal",
        "submit .add-social form": "add",
        "click .add-social .cancel-btn": "closeAddModal"
    },
    model: Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: 'index'
        })
    }),
    initialize: function() {
        console.log( "Creating new instance of Social" );
        const self = this;
        this.model = new this.model();
        this.model.on('add', m => { self.render( m ) });
        this.model.on('reset', () => { self.$el.find('.btns').empty(); });
        this.model.on('remove', m => {
            self.$el.find(`.social-btn-${m.get('index')}`).remove();
        });
        this.socialMediaIcons = this.socialMediaIcons.sort();
        this.socialMediaIcons.forEach(e => {
            this.$el.find('.add-social [name=type]').append(`<option value="${e}">${e}</option>`)
        });
        this.$el.find('.add-social [name=type]').append(`<option value="share-alt">other</option>`)
    },
    render: function( el ) {
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
        newBtn.type = ev.currentTarget.querySelector('[name=type]').value.split("-")[0];
        newBtn.icon = ev.currentTarget.querySelector('[name=type]').value;
        newBtn.url = ev.currentTarget.querySelector('[name=url]').value;
        newBtn.index = Math.max( ...this.model.toJSON().map( a => a.index ) ) + 1;
        if ( newBtn.index == -Infinity )
            newBtn.index = 1;
        this.model.add( newBtn );
        console.log( newBtn, this.model );

        this.$el.find('.add-social').hide();
    },
    openAddModal: function( ev ) {
        ev.preventDefault();
        console.log("Opening n")
        this.$el.find('.add-social').show();
    },
    closeAddModal: function( ev ) {
        ev.preventDefault();
        this.$el.find('.add-social').hide();
    }
});
const ContactBtnView = Backbone.View.extend({
    el: "#profile .contact-btns",
    icons: [
        { value: 'phone', name: 'Phone'},
        { value: 'whatsapp', name: 'WhatsApp'},
        { value: 'telegram', name: 'Telegram'},
        { value: 'map-marker', name: 'Address'},
        { value: 'link', name: 'Website'},
        { value: 'envelope', name: 'Email'},
        { value: 'link', name: 'Other'}
    ],
    template: _.template(`<span class='contact-btn-<%=index%> w3-display-container btn-container'>
        <a target="_blank" href="<%= url %>" class="w3-bar-item w3-button w3-block w3-padding-16">
            <i class="fa fa-<%= icon %>"></i>
            <%= value %>
        </a>
        <button data-index="<%= index %>" class='w3-card remove w3-button w3-theme w3-display-right w3-margin-right w3-round-xxlarge'>&times;</button>
    </span>`),
    events: {
        'click .remove': 'remove',
        "click .add": "openAddModal",
        "submit .add-contact form": "add",
        "click .add-contact .cancel-btn": "closeAddModal"
    },
    model: Backbone.Collection.extend({
        model: Backbone.Model.extend({
            idAttribute: 'index'
        })
    }),
    initialize: function() {
        const self = this;
        this.model = new this.model();
        this.model.on('add', m => { self.render( m ) });
        this.model.on('reset', () => { self.$el.find('.btns').empty(); });
        this.model.on('remove', m => {
            self.$el.find(`.contact-btn-${m.get('index')}`).remove();
        });
        this.icons.forEach(e => {
            this.$el.find('.add-contact [name=type]').append(`<option value="${e.value}">${e.name}</option>`)
        });
    },
    render: function( el ) {
        if ( el.get('type') == 'envelope' ) el.set('url', `mailto:${el.get('value')}`);
        else if ( el.get('type') == 'phone' ) el.set('url', `tel:${el.get('value')}`);
        else if ( el.get('type') == 'whatsapp' ) el.set('url', `https://wa.me/${el.get('value')}`)
        else if ( el.get('type') == 'telegram' ) el.set('url', `https://t.me/${el.get('value')}`)
        else if ( el.get('type') == 'link' ) {el.set('url', el.get('value')); console.log( el.get('url') )}
        else el.set('url', null);
        this.$el.find('.btns').append( this.template( el.toJSON() ) );
        console.log( el.toJSON() )
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
        newBtn.icon = ev.currentTarget.querySelector('[name=type]').value;
        newBtn.value = ev.currentTarget.querySelector('[name=value]').value;
        newBtn.type = newBtn.icon;
        newBtn.index = Math.max( ...this.model.toJSON().map( a => a.index ) ) + 1;
        if ( newBtn.index == -Infinity )
            newBtn.index = 1;
        console.log( newBtn );
        this.model.add( newBtn );
        console.log( this.model.toJSON() );
        this.$el.find('.add-contact').hide();
    },
    openAddModal: function( ev ) {
        ev.preventDefault();
        this.$el.find('.add-contact').show();
    },
    closeAddModal: function( ev ) {
        ev.preventDefault();
        this.$el.find('.add-contact').hide();
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
        if( !this.socials )
            this.socials = new SocialBtnView();
        if( !this.contacts )
            this.contacts = new ContactBtnView();
        if( !this.links )
            this.links = new LinkBtnView();

        this.socials.model.add( this.model.get("socials").sort( (a,b) => a.index - b.index ) );
        this.contacts.model.add( this.model.get("contacts").sort( (a,b) => a.index - b.index ) );
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
                location.href = "/"
                // route.navigate("", { trigger: true});
            },
            error: function() {
                $(ev.currentTarget).find(".fa").remove();
                alert( "Counldn't delete." );
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
        console.log( themeUrl )
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
            socials: this.socials.model.toJSON(),
            links: this.links.model.toJSON(),
            theme: self.$el.find("#profile-theme").val()
        };
        $(ev.currentTarget).prepend(`<i class='fa fa-refresh fa-spin'></i> `);
        this.model.save(newObj,{
            success: function() {
                $(ev.currentTarget).find('.fa').remove();
                self.model.fetch();
                route.navigate("/", {trigger:true})
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
                alert("Oh oh! Not able to find any user.");
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
                        a += `EMAIL;TYPE=home:${r.value}`
                });
                return a;
            },
            getWebsite: () => {
                let a = "";
                self.model.get('contacts').forEach( r => {
                    if( r.type =='link' )
                        a += `URL;TYPE=home:${r.value}\n`
                });
                self.model.get('links').forEach( r => {
                    a += `URL;TYPE=work:${r.url}\n`
                });
                return a;
            }
        }
        let template = `BEGIN:VCARD
        VERSION:4.0
        ${VCF.getName()}
        ${VCF.getTitle()}
        ${VCF.getPhone()}
        ${VCF.getEmail()}
        ${VCF.getWebsite()}
        END:VCARD`;
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

const loader = new Spinner();
var profileChooser = null; 
const header = new Header();
const authView = new Authorize();
var profileView = null;
var publicProfileView = null;

loader.render();
const Router = Backbone.Router.extend({
    routes: {
        "": "homepage",
        "auth": "auth",
        "profile-chooser": "profileChooser",
        "profile/:id": "profile",
        ":encoded": "publicProfile"
    },
    homepage: function() {
        console.log("Page: "+location.hash);
        this.navigate("profile-chooser", {trigger:true});
    },
    validateLogin: function() {
        if( !localStorage.getItem("auth-token") || localStorage.getItem("auth-token").length < 15 ) {
            this.navigate("#auth", {trigger: true});
            throw new Error("User not authenticated");
        }
    },
    auth: function() {
        console.log( "PAGE: "+location.hash );
        authView.render();
    },
    profileChooser: function() {
        console.log("Page: "+location.hash);
        this.validateLogin();
        if( profileChooser == null || profileChooser == undefined )
            profileChooser = new ProfileChooserView();
        header.render();
        profileChooser.render();
    },
    profile: function( id ) {
        console.log("Page: "+location.hash);
        this.validateLogin();
        if ( !profileView )
            profileView = new ProfileView();
        profileView.model.set('id', id);
        profileView.render();
        header.render();
    },
    publicProfile: function( id ) {
        console.log("Page: "+location.hash);
        if ( !publicProfileView )
            publicProfileView = new PublicProfileView();
        publicProfileView.model.set('code', id);
        publicProfileView.render();
    }
});
const route = new Router();
Backbone.history.start();
