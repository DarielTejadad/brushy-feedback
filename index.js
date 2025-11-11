const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ] 
});

// Configuración
const CONFIG = {
  feedbackChannelId: '1437619923810783362', // Canal donde se enviarán los feedbacks
  allowedRoles: [
    '1437623596322394142', // Cliente Premium
    '1437623932529279047'  // Cliente
  ]
};

client.on('ready', () => {
  console.log(`✅ Bot Feedback conectado como ${client.user.tag}`);
  
  // Registrar comando slash
  const feedbackCommand = new SlashCommandBuilder()
    .setName('feedback')
    .setDescription('Envía tu feedback sobre nuestros servicios')
    .addStringOption(option => 
      option.setName('calificacion')
        .setDescription('Calificación del servicio (1-5 estrellas)')
        .setRequired(true)
        .addChoices(
          { name: '⭐ (1 estrella)', value: '1' },
          { name: '⭐⭐ (2 estrellas)', value: '2' },
          { name: '⭐⭐⭐ (3 estrellas)', value: '3' },
          { name: '⭐⭐⭐⭐ (4 estrellas)', value: '4' },
          { name: '⭐⭐⭐⭐⭐ (5 estrellas)', value: '5' }
        )
    )
    .addStringOption(option => 
      option.setName('mensaje')
        .setDescription('Tu mensaje de feedback')
        .setRequired(true)
        .setMaxLength(1000)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages);
  
  client.application.commands.set([feedbackCommand])
    .then(() => console.log('✅ Comando /feedback registrado'))
    .catch(console.error);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  
  if (interaction.commandName === 'feedback') {
    // Verificar si el usuario tiene los roles permitidos
    const hasAllowedRole = interaction.member.roles.cache.some(role => 
      CONFIG.allowedRoles.includes(role.id)
    );
    
    if (!hasAllowedRole) {
      return interaction.reply({
        content: '❌ Este comando solo está disponible para clientes y clientes premium.',
        ephemeral: true
      });
    }
    
    const calificacion = interaction.options.getString('calificacion');
    const mensaje = interaction.options.getString('mensaje');
    
    try {
      // Obtener el canal de feedback
      const feedbackChannel = await client.channels.fetch(CONFIG.feedbackChannelId);
      
      if (!feedbackChannel) {
        return interaction.reply({
          content: '❌ No se pudo encontrar el canal de feedback. Contacta con un administrador.',
          ephemeral: true
        });
      }
      
      // Crear embed para el feedback
      const feedbackEmbed = new EmbedBuilder()
        .setTitle('📝 Nuevo Feedback Recibido')
        .addFields(
          { 
            name: '👤 Usuario', 
            value: `${interaction.user} (${interaction.user.id})`, 
            inline: true 
          },
          { 
            name: '⭐ Calificación', 
            value: `${'⭐'.repeat(parseInt(calificacion))} (${calificacion}/5)`, 
            inline: true 
          },
          { 
            name: '📅 Fecha', 
            value: `<t:${Math.floor(Date.now() / 1000)}:F>`, 
            inline: true 
          },
          { 
            name: '💬 Mensaje', 
            value: mensaje, 
            inline: false 
          }
        )
        .setColor(getColorByRating(parseInt(calificacion)))
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ 
          text: 'Brushy Feedback System',
          iconURL: interaction.guild.iconURL()
        });
      
      // Enviar el feedback al canal
      await feedbackChannel.send({ embeds: [feedbackEmbed] });
      
      // Confirmación al usuario
      const confirmEmbed = new EmbedBuilder()
        .setTitle('✅ Feedback Enviado')
        .setDescription('¡Gracias por tu feedback! Lo hemos recibido correctamente.')
        .addFields(
          { 
            name: 'Tu calificación', 
            value: `${'⭐'.repeat(parseInt(calificacion))} (${calificacion}/5)`, 
            inline: true 
          },
          { 
            name: 'Tu mensaje', 
            value: mensaje.length > 100 ? mensaje.substring(0, 100) + '...' : mensaje, 
            inline: false 
          }
        )
        .setColor(0x00FF00)
        .setFooter({ text: 'Brush Studio' });
      
      await interaction.reply({ 
        embeds: [confirmEmbed],
        ephemeral: true 
      });
      
      console.log(`✅ Feedback enviado por ${interaction.user.tag}: ${calificacion} estrellas`);
      
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      await interaction.reply({
        content: '❌ Ocurrió un error al enviar tu feedback. Por favor, inténtalo más tarde.',
        ephemeral: true
      });
    }
  }
});

// Función para obtener el color según la calificación
function getColorByRating(rating) {
  switch (rating) {
    case 1: return 0xFF0000; // Rojo
    case 2: return 0xFF7F00; // Naranja
    case 3: return 0xFFFF00; // Amarillo
    case 4: return 0x7FFF00; // Verde amarillento
    case 5: return 0x00FF00; // Verde
    default: return 0x3498db; // Azul por defecto
  }
}

// Manejo de errores
client.on('error', error => {
  console.error('Error del bot:', error);
});

process.on('unhandledRejection', error => {
  console.error('Error no manejado:', error);
});

// Iniciar el bot
client.login(process.env.TOKEN);
