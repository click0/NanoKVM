package proto

type LoginReq struct {
	Username string `validate:"required"`
	Password string `validate:"required"`
}

type LoginRsp struct {
	Token string `json:"token"`
}

type ChangePasswordReq struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

type IsPasswordUpdatedRsp struct {
	IsUpdated bool `json:"isUpdated"`
}
