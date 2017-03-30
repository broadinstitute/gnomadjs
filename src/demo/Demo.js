import React from 'react'

import { BrowserRouter as Router, NavLink, Route } from 'react-router-dom'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import Drawer from 'material-ui/Drawer'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton'

import RegionViewerDemo from '../RegionViewer/RegionViewer.example'

import css from './styles.css'

class DrawerSimpleExample extends React.Component {

  state = { open: false }

  handleToggle = () => this.setState({ open: !this.state.open })

  render() {
    return (
      <div>
        <RaisedButton
          label="Open menu"
          onTouchTap={this.handleToggle}
        />
        <Drawer open={this.state.open}>
          <MenuItem onClick={this.handleToggle}>Close menu</MenuItem>
          <NavLink
            className={css.navlink}
            activeClassName={css.active}
            exact
            to={'/'}
          >
            <MenuItem>Home</MenuItem>
          </NavLink>
          <NavLink
            className={css.navlink}
            activeClassName={css.active}
            exact
            to={'/region-table'}
          >
            <MenuItem>Region table</MenuItem>
          </NavLink>
        </Drawer>
      </div>
    )
  }
}

const Demo = () =>
  <Router>
    <div>
      <DrawerSimpleExample />
      <div className={css.demoArea}>
        <Route exact path={'/'} render={() => <h1>gnomAD component demos</h1>} />
        <Route exact path={'/region-table'} component={RegionViewerDemo} />
      </div>
    </div>
  </Router>

const muiTheme = getMuiTheme({
  palette: {
    primary1Color: '#4682b4',
  },
  appBar: {
    height: 50,
  },
})

const WrappedDemo = () =>
  <MuiThemeProvider muiTheme={getMuiTheme(muiTheme)}>
    <Demo />
  </MuiThemeProvider>

export default WrappedDemo
