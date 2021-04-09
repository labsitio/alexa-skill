const Alexa = require('ask-sdk-core');
const Util = require('./util');
const helper = require('./helper');

const PERMISSIONS = ['alexa::profile:name:read'];

const messages = {
    WELCOME: 'Olá #nome, que bom que você me chamou. Melhor ainda é saber que nós trabalhamos juntos, ter você na equipe é uma alegria enorme. Sabia que a gente preparou uma mensagem de natal especialmente pra você? Se quiser ouvir é só me perguntar: “Qual é a minha mensagem de Natal?”',
    WELCOME_TO_OTHERS: 'Olá, bem vindo a minha Labsit! Se você quiser que eu lhe chame pelo nome, basta conceder uma permissão no aplicativo Alexa e definir seu nome lá também. Aqui você pode obter informações e novidades da empresa Labsit. Tente me perguntar qual o endereço, quais os clientes ou com quais tecnologias ela trabalha.',
    HELP: 'Você pode obter informações e novidades da empresa Labsit. Tente me perguntar qual o endereço, quais os clientes ou com quais tecnologias ela trabalha.',
    GOODBYE: '<say-as interpret-as="interjection">Até a próxima</say-as>',
    FALLBACK: 'Desculpe, isso que você pediu é sigiloso. Tente pedir outra coisa.',
    ERROR: 'Desculpe, me perdi enquanto procurava o que você solicitou. Por favor, tente novamente.',
    TIP: '<say-as interpret-as="interjection">Ah!</say-as> <p>Você ja entrou no grupo MEMES e FIGURINHAS no zap zap?</p>',
    NOTIFY_PERMISSIONS: 'Para que eu identifique seu nome e execute corretamente esta skill, preciso que você vá até a tela inicial do aplicativo Alexa no conceda as permissões necessárias.',
    DEFINE_NAME: 'Para essa funcionalidade você deve definir seu nome e sobrenome no aplicativo Alexa.',
    MESSAGE_NOT_FIND: 'O amor é o melhor presente para oferecer a quem amamos. Feliz Natal e um ótimo Ano Novo!',
    DARLAN_IMITATION: '<say-as interpret-as="interjection">bah tchê!</say-as> <p><prosody pitch="x-high" rate="fast">Extraviado que nem chinelo de bêbado.</prosody></p>',
    DIMAS_CUT_HIS_HAIR: ['<say-as interpret-as="interjection">Meu deus!</say-as> <p>Já imaginou o Dimas careca?</p>', 'Acho que não, ele é muito vaidoso.', 'Só se matar ele antes.', 'Acho que só quando atingirmos 100 funcionários.', 'Assunto delicado... <amazon:effect name="whispered">Mas eu acho que a Lili não deixa.</amazon:effect>'],
    CLIENTS: 'Seus principais clientes são Askme, Careplus, Centauro, Colégio Bandeirantes, Conductor, Contmatic, Credz, Dotz, Grupo Bandeirantes, ih!restrito, Limpidus, Netpoints, Prescon, Via Varejo, Viimo e Voopter.',
    LOCALIZATION: 'Fica localizada na Avenida Paulista, 302 em São Paulo',
    TECHNOLOGIES: 'Trabalha com a melhor tecnologia para o seu negócio! Seja ela Java, CSharp, Angular, React Native, Node, PHP e o que mais precisar'
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
        const consentToken = requestEnvelope.context.System.apiAccessToken;

        if (!consentToken) {
            return responseBuilder
                .speak(messages.NOTIFY_PERMISSIONS)
                .withAskForPermissionsConsentCard(PERMISSIONS)
                .getResponse();
        }

        try {
            const client = serviceClientFactory.getUpsServiceClient();
            const name = await client.getProfileName();
            const firstName = name.split(' ')[0];
            const speakOutput = messages.WELCOME.replace('#nome', firstName);
       
            return responseBuilder
                .speak(speakOutput)
                .reprompt(speakOutput)
                .getResponse();
           
        } catch (error) {
            if (error.name !== 'ServiceError') {
                const response = responseBuilder.speak(messages.ERROR).getResponse();
                return response;
            }
            
            throw error;
        }
    }
};

const TipIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TipIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.TIP)
            .getResponse();
    }
};

const EndYearMessageIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EndYearMessageIntent';
    },
    async handle(handlerInput) {
        const { requestEnvelope, serviceClientFactory, responseBuilder } = handlerInput;
        const consentToken = requestEnvelope.context.System.apiAccessToken;

        if (!consentToken) {
            return responseBuilder
                .speak(messages.NOTIFY_PERMISSIONS)
                .withAskForPermissionsConsentCard(PERMISSIONS)
                .getResponse();
        }
    
        try {
            const client = serviceClientFactory.getUpsServiceClient();
            const name = await client.getProfileName();
          
            if(!name) {
                return responseBuilder
                    .speak(messages.DEFINE_NAME)
                    .withShouldEndSession(true)
                    .getResponse();
            }

            let speakOutput = messages.MESSAGE_NOT_FIND;
            
            const messagesUrl = Util.getS3PreSignedUrl("Media/mensagens.json");
            await helper.getRemoteData(messagesUrl)
                .then((response) => {
                    const data = JSON.parse(response);
                    const message = helper.getMessageFromArray(name, data.mensagens);

                    if(message.mensagem) {
                        speakOutput = message.mensagem;
                    }
                })
                .catch((err) => {
                    console.log(JSON.stringify(err));
                    return responseBuilder.speak(messages.ERROR).getResponse();
                });

            /*
            // Lendo de arquivo em url pública
            await helper.getRemoteData("https://api.jsonbin.io/b/5fd11c9e81ec296ae71bdd75")
                .then((response) => {
                    const data = JSON.parse(response);
                    const message = helper.getMessageFromArray(name, data.mensagens);

                    if(message.mensagem) {
                        speakOutput = message.mensagem;
                    }
                })
                .catch((err) => {
                    console.log(JSON.stringify(err));
                    return responseBuilder.speak(messages.ERROR).getResponse();
                });

            // Lendo de arquivo local
            const message = helper.getMessageFromArray(name, mensagensFinalAno.mensagens);
            
            if (message.mensagem) {
                return responseBuilder
                    .speak(message.mensagem)
                    .reprompt(message.mensagem)
                    .getResponse();
            }
            
             return responseBuilder
                    .speak(messages.MESSAGE_NOT_FIND)
                    .reprompt(messages.MESSAGE_NOT_FIND)
                    .getResponse();
            */
            
            return responseBuilder
                .speak(speakOutput)
                .withShouldEndSession(true)
                .getResponse();
           
        } catch (error) {
            if (error.name !== 'ServiceError') {
                const response = responseBuilder.speak(messages.ERROR).getResponse();
                return response;
            }
        
            throw error;
        }
    }
};

const DimasCutHisHairIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DimasCutHisHairIntent';
    },
    handle(handlerInput) {
        const speakOutput = helper.randomPhrase(messages.DIMAS_CUT_HIS_HAIR);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const DarlanImitationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DarlanImitationIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.DARLAN_IMITATION)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const ClientsIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClientsIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.CLIENTS)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const LocalizationIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LocalizationIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.LOCALIZATION)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const TechnologiesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'TechnologiesIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.TECHNOLOGIES)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.HELP)
            .reprompt(messages.HELP)
            .withShouldEndSession(false)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.GOODBYE)
            .getResponse();
    }
};

/*
const ReceberCpfIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReceberCpfIntent';
    },
    handle(handlerInput) {
        const slots = handlerInput.requestEnvelope.request.intent.slots;
        const cpf = slots['cpf'].value;
        const speakOutput = `Seu CPF é: ${cpf}. Correto?`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
  },
};
*/

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.FALLBACK)
            .getResponse();
    }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */

const ErrorHandler = {
  canHandle(handlerInput, error) {
    return error.name === 'ServiceError';
  },
  handle(handlerInput, error) {
    if (error.statusCode === 403) {
      return handlerInput.responseBuilder
        .speak(messages.NOTIFY_PERMISSIONS)
        .withAskForPermissionsConsentCard(PERMISSIONS)
        .getResponse();
    }
    
    return handlerInput.responseBuilder
      .speak(messages.ERROR)
      .reprompt(messages.ERROR)
      .getResponse();
  },
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        TipIntentHandler,
        EndYearMessageIntentHandler,
        DimasCutHisHairIntentHandler,
        DarlanImitationIntentHandler,
        ClientsIntentHandler,
        LocalizationIntentHandler,
        TechnologiesIntentHandler)
    .addErrorHandlers(
        ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('labsit/labsit-skill/v1.0')
    .lambda();