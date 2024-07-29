import jwt from 'jsonwebtoken'
import {v1} from 'uuid'
import crypto from 'crypto'

const priv8 = `-----BEGIN RSA PRIVATE KEY-----
MIIEoQIBAAKCAQBrSVfyM8ajMqUdEdFaJbC9dKOC/aBSPJwXnNIP+o5s5uj9y0Lz
2riQ/IX7XodOqidWyE06yiy5WTK7QLjp1kDj+yQIXbg/EEYsTgYUj7O50o/38mui
sxvD9BiGdVFqXWHXGxTZoioKhFW5yp6hCC29OHL156nUavY53z/s18MHm20SqIHB
Tre0xsuJxdbIL74wqvqlOaDo/sQMyC793+qK2vIEsYUvv4e5AnoeRkftHE9cVwhE
uW4I8+hpbtTJnU1VIi4VHEXLBFghMwEh/+tb8wuiZeB8lUPQxszSMIcMQ2kr4FBn
yFR2EoT3ZR2bYGW7y/l6ahJ36GUce3dvSmLxAgMBAAECggEAJV7Kz4bRbg86DEIk
li4CvjteqUYHDh4mkOMDGKXB7pUQGzct/xr0pywOz1xB7Vi/ky76F7xMj9NOJIOK
5YjH2aGlD3T1tKHKj6wt2gOkKtn5Y/iBHY8d4Meps0wyK8aTSgYY4SXnVvp5kdnO
H3Fl3T9Ia/dh5KfNVKM69RjCymcZBHBNb/+oMwBynaZNlqeHaOb/liitX5VXtq7k
JTcT+rWT38tIQrhod+KU1/3mPsBm2ODGpBWh1p2b4afX024D8GVY5BnvJgm9f6kr
nPkGzlmuujhUICHusMEJeQHtVVOwYhhT8XAZ4QQK74AaQylzidJNfaIhfnqH31vu
BF3pQQKBgQC52rEjUEGsT/E9U/2yQLqO4K357pmPjjZj0rkUQdhCljYjBg5sQA3M
JyY2oYXs0uVimLQuS9mzaGi+2PZkRRTr/IUOleGmmucNj+I9QZkKJRuGqELmIeDv
WsFDZxS3ucE3/VpJE5S/oVkszgpIfDnj5WmqejgdCOjsrTFCJQTS5QKBgQCTx2eg
G/HQYHnN7bsZCPKsDjNdPaR4Ex2F0RvbZRr548KQlTtui9WsIrcGI3/qdWylVlLJ
aQOMYGdtk3qe8/tyL3cdU92Bt5K7jBUGBFNHldgLrzDbfMXWYdbFR6IhglCbEc6V
r5M5fTsd5a0UsUxhl+CW3NoX4If9R9FY8sGTHQKBgAVOUAZRET7pHVsB3dlL7ceM
dIsRG8M0bSsWZgBFDPaBsVP4pUrD3WD5sSaYH+mt76yL7YDw22s6zNq9+PLN4hYG
pInRD5shCv2hIPVcvRDEFHAYt6g4SWKr9Z6F/9pq7DA8BGrXq0R5R8F2tGZzXXe7
IfQi/x0dFwFCxIg95FBdAoGAIqV8iRAkKGuGAx66X8s2QdpudmzOU4x/vnDhLBXP
NkkMw6MJNQi5xsq4yEqoYcq39yd+71OcjlvHw+vwsrWW/RVdwtV3uELWtvvHrgpz
j/P0nACt3repFnMHzGbX/y0zQrfxDC0GwlK2+nJvmstakgLul9Adnb15hItC7Ky1
b40CgYAmuVnRrCKrvZ9/0UjbtdRLFzcQuyVpM62PQtBhnaic1snT+obmZUbHdAlD
xYOhI0eL+EYVgG61PhP6xdPu2HVQscXRr7o8VkhSzahAxBR2kbpoHBHlAQEf/OCR
YngsTLUtQ8UXBLpbS7bxjZAtvF+HQo/EZdold4WVFwBDpUc9SA==
-----END RSA PRIVATE KEY-----
`
let publik = `-----BEGIN PUBLIC KEY-----
MIIBITANBgkqhkiG9w0BAQEFAAOCAQ4AMIIBCQKCAQBrSVfyM8ajMqUdEdFaJbC9
dKOC/aBSPJwXnNIP+o5s5uj9y0Lz2riQ/IX7XodOqidWyE06yiy5WTK7QLjp1kDj
+yQIXbg/EEYsTgYUj7O50o/38muisxvD9BiGdVFqXWHXGxTZoioKhFW5yp6hCC29
OHL156nUavY53z/s18MHm20SqIHBTre0xsuJxdbIL74wqvqlOaDo/sQMyC793+qK
2vIEsYUvv4e5AnoeRkftHE9cVwhEuW4I8+hpbtTJnU1VIi4VHEXLBFghMwEh/+tb
8wuiZeB8lUPQxszSMIcMQ2kr4FBnyFR2EoT3ZR2bYGW7y/l6ahJ36GUce3dvSmLx
AgMBAAE=
-----END PUBLIC KEY----- `

const hhmc = 'undefined'
const issueJWTWithCommonUser = (emailAddress, secId, scope, username, type, userId, expInMin) => {
  return jwt.sign(
    {
      subject: username,
      scope,
      type,
      userId,
      emailAddress,
      secId: v1(),
      exp: Math.floor(Date.now()) + expInMin * 60 * 1000,
    },
    priv8,
    {algorithm: 'RS512'}
  )
}
const verifyJWT = (tokenString) => {
  let decoded
  try {
    decoded = jwt.verify(tokenString, publik)
    if (decoded.exp && decoded.exp < Math.floor(Date.now())) {
      decoded = false
    }
  } catch (err) {
    decoded = false
  }
  return decoded
}

const issueJWTForApp = (userId, scope, body) => {
  console.log('###############', userId, scope, body)
  body.userId = userId
  body.subject = userId
  body.secId = v1()
  body.scope = scope
  if (scope[0] == 'admin') {
    body.exp = Math.floor(Date.now()) + 9 * 60 * 60 * 1000
  } else {
    body.exp = Math.floor(Date.now()) + 24 * 60 * 60 * 1000
  }

  return jwt.sign(body, priv8, {algorithm: 'RS512'})
}

const issueJWTForSekeh = (userId, scope, media, body) => {
  console.log('###############', userId, scope, body)
  body.userId = userId
  body.subject = userId
  body.secId = v1()
  body.scope = scope
  body.media = media
  return jwt.sign(body, priv8, {algorithm: 'RS512'})
}

//, expiresIn: Date.now()

// const issueJWTForApp = (channelName, channelID,expInMin)=>{
//     return jwt.sign({
//         channelName,
//         channelID,
//         exp: Math.floor(Date.now() ) + (expInMin * 60 * 1000),
//     }, priv8, {algorithm: 'RS512'});
// }

const hashString = (string) => {
  return crypto.createHmac('sha512', hhmc).update(string).digest('hex')
}

export default {
  issueJWTWithCommonUser,
  issueJWTForApp,
  issueJWTForSekeh,
  verifyJWT,
  hashString,
  publik,
}
