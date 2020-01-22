module.exports = {
    forgecredentials: {
        client_id: " ",
        client_secret: " "
    },
    awscredentials: {
        accessKeyId: " ",
        secretAccessKey: " "
    },
    forge: {
        forge_bucket: "testfile"
    },
    aws: {
        s3_bucket: "kward-bucket"
    },
    scopes: {
        // Required scopes for the server-side application
        internal: ['bucket:create', 'bucket:read', 'data:read', 'data:write'],
        // Required scope for the client-side viewer
        public: ['viewables:read']
    }
}